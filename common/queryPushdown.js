const CONTROL_KEYS = new Set([
  "_sort",
  "_page",
  "_pageSize",
  "_per_page",
  "_limit",
  "_embed",
  "_where",
]);

const SUPPORTED_OPS = new Set([
  "eq",
  "is",
  "ne",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "like",
  "in",
  "nin",
]);

const FIELD_RE = /^[A-Za-z_][A-Za-z0-9_.]*$/;

const clone = (obj) => JSON.parse(JSON.stringify(obj || {}));

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.prototype.toString.call(value) === "[object Object]";

const parseValue = (value) => {
  if (Array.isArray(value)) return value.map(parseValue);
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  const number = Number(trimmed);
  if (!Number.isNaN(number)) return number;
  return trimmed;
};

const toArray = (value) => {
  if (Array.isArray(value)) return value.map(parseValue);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((x) => parseValue(x.trim()))
      .filter((x) => x !== "");
  }
  if (value === null || value === undefined) return [];
  return [value];
};

const parseFieldOp = (key) => {
  const idx = key.lastIndexOf(":");
  if (idx <= 0) return { field: key, op: "eq" };
  return {
    field: key.slice(0, idx),
    op: key.slice(idx + 1) || "eq",
  };
};

const normalizeOperator = (op) => {
  const map = {
    is: "eq",
    neq: "ne",
  };
  const normalized = String(op || "eq").toLowerCase();
  return map[normalized] || normalized;
};

const escapeLiteral = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    if (Number.isFinite(value)) return String(value);
    return "NULL";
  }
  if (typeof value === "boolean") return value ? "'true'" : "'false'";
  const text =
    typeof value === "string" ? value : JSON.stringify(value || null);
  return `'${String(text).replace(/'/g, "''")}'`;
};

const getFieldExpr = (dialect, fieldName) => {
  if (fieldName === "_id" || fieldName === "id") {
    if (dialect === "postgres") return "_id::text";
    if (dialect === "sqlite") return "CAST(_id AS TEXT)";
    return "CAST(_id AS NVARCHAR(200))";
  }

  if (!FIELD_RE.test(fieldName)) return null;
  const parts = fieldName.split(".");

  if (dialect === "postgres") {
    if (parts.length === 1) {
      return `document->>'${parts[0]}'`;
    }
    return `document #>> '{${parts.join(",")}}'`;
  }

  if (dialect === "sqlite") {
    const jsonPath = "$." + parts.join(".");
    return `json_extract(document, '${jsonPath}')`;
  }

  const jsonPath = "$." + parts.join(".");
  return `JSON_VALUE(document, '${jsonPath}')`;
};

const getNumericExpr = (dialect, fieldExpr) => {
  if (dialect === "postgres") {
    return `CASE WHEN ${fieldExpr} ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (${fieldExpr})::numeric END`;
  }
  if (dialect === "sqlite") {
    return `CASE
      WHEN ${fieldExpr} GLOB '-[0-9]*' THEN CAST(${fieldExpr} AS REAL)
      WHEN ${fieldExpr} GLOB '[0-9]*' THEN CAST(${fieldExpr} AS REAL)
      WHEN ${fieldExpr} GLOB '-[0-9]*.[0-9]*' THEN CAST(${fieldExpr} AS REAL)
      WHEN ${fieldExpr} GLOB '[0-9]*.[0-9]*' THEN CAST(${fieldExpr} AS REAL)
    END`;
  }
  return `TRY_CAST(${fieldExpr} AS FLOAT)`;
};

const buildPredicate = (dialect, field, op, value) => {
  const normalizedOp = normalizeOperator(op);
  if (!SUPPORTED_OPS.has(normalizedOp)) return null;

  const fieldExpr = getFieldExpr(dialect, field);
  if (!fieldExpr) return null;

  if (normalizedOp === "eq") {
    if (value === null) return `${fieldExpr} IS NULL`;
    if (typeof value === "number") {
      return `${getNumericExpr(dialect, fieldExpr)} = ${escapeLiteral(value)}`;
    }
    return `${fieldExpr} = ${escapeLiteral(value)}`;
  }

  if (normalizedOp === "ne") {
    if (value === null) return `${fieldExpr} IS NOT NULL`;
    if (typeof value === "number") {
      return `${getNumericExpr(dialect, fieldExpr)} <> ${escapeLiteral(value)}`;
    }
    return `${fieldExpr} <> ${escapeLiteral(value)}`;
  }

  if (normalizedOp === "gt" || normalizedOp === "gte" || normalizedOp === "lt" || normalizedOp === "lte") {
    const comparatorMap = {
      gt: ">",
      gte: ">=",
      lt: "<",
      lte: "<=",
    };
    const comparator = comparatorMap[normalizedOp];

    if (typeof value === "number") {
      return `${getNumericExpr(dialect, fieldExpr)} ${comparator} ${escapeLiteral(value)}`;
    }
    return `${fieldExpr} ${comparator} ${escapeLiteral(value)}`;
  }

  if (normalizedOp === "contains" || normalizedOp === "like") {
    const likeVal = `%${String(value)}%`;
    return `${fieldExpr} IS NOT NULL AND LOWER(${fieldExpr}) LIKE LOWER(${escapeLiteral(
      likeVal
    )})`;
  }

  if (normalizedOp === "in" || normalizedOp === "nin") {
    const values = toArray(value);
    if (values.length === 0) return normalizedOp === "in" ? "1=0" : "1=1";
    const escaped = values.map((x) => escapeLiteral(x)).join(", ");
    return `${fieldExpr} ${normalizedOp === "in" ? "IN" : "NOT IN"} (${escaped})`;
  }

  return null;
};

const hasLogicalKeys = (obj) =>
  isPlainObject(obj) &&
  ("and" in obj || "or" in obj || "not" in obj);

const buildConditionFromObject = (dialect, condition) => {
  if (!isPlainObject(condition)) return null;

  const parts = [];

  if ("field" in condition) {
    const field = condition.field;
    const op = condition.op || "eq";
    const value = parseValue(condition.value);
    return buildPredicate(dialect, field, op, value);
  }

  if ("and" in condition) {
    const andRules = Array.isArray(condition.and) ? condition.and : null;
    if (!andRules || andRules.length === 0) return null;
    const andSql = andRules
      .map((rule) => buildConditionFromObject(dialect, rule))
      .filter(Boolean);
    if (andSql.length !== andRules.length) return null;
    parts.push(`(${andSql.join(" AND ")})`);
  }

  if ("or" in condition) {
    const orRules = Array.isArray(condition.or) ? condition.or : null;
    if (!orRules || orRules.length === 0) return null;
    const orSql = orRules
      .map((rule) => buildConditionFromObject(dialect, rule))
      .filter(Boolean);
    if (orSql.length !== orRules.length) return null;
    parts.push(`(${orSql.join(" OR ")})`);
  }

  if ("not" in condition) {
    const notSql = buildConditionFromObject(dialect, condition.not);
    if (!notSql) return null;
    parts.push(`(NOT (${notSql}))`);
  }

  const plainKeys = Object.keys(condition).filter(
    (key) => key !== "and" && key !== "or" && key !== "not"
  );

  for (const key of plainKeys) {
    const value = condition[key];
    const { field, op } = parseFieldOp(key);
    if (!FIELD_RE.test(field) && field !== "_id" && field !== "id") return null;

    if (isPlainObject(value) && !hasLogicalKeys(value) && !("field" in value)) {
      const nestedOps = Object.keys(value);
      if (nestedOps.length === 0) return null;
      const nestedSql = [];
      for (const nestedOp of nestedOps) {
        const sqlPart = buildPredicate(
          dialect,
          field,
          nestedOp,
          parseValue(value[nestedOp])
        );
        if (!sqlPart) return null;
        nestedSql.push(sqlPart);
      }
      parts.push(`(${nestedSql.join(" AND ")})`);
      continue;
    }

    const predicate = buildPredicate(dialect, field, op, parseValue(value));
    if (!predicate) return null;
    parts.push(predicate);
  }

  if (parts.length === 0) return null;
  return parts.join(" AND ");
};

const buildSortClause = (dialect, sortValue) => {
  if (!sortValue) return { sql: "", ok: true };

  const descriptors = String(sortValue)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (descriptors.length === 0) return { sql: "", ok: true };

  const parts = [];
  for (const descriptor of descriptors) {
    const desc = descriptor.startsWith("-");
    const field = desc ? descriptor.slice(1) : descriptor;
    const dir = desc ? "DESC" : "ASC";
    const fieldExpr = getFieldExpr(dialect, field);
    if (!fieldExpr) return { ok: false, sql: "" };
    const numericExpr = getNumericExpr(dialect, fieldExpr);
    parts.push(`COALESCE(${numericExpr}, 0) ${dir}`);
    parts.push(`${fieldExpr} ${dir}`);
  }

  return { sql: parts.join(", "), ok: true };
};

const buildPagination = (query) => {
  const limitRaw = query._per_page || query._pageSize || query._limit;
  const pageRaw = query._page;

  if (limitRaw === undefined && pageRaw === undefined) {
    return { ok: true, limit: null, offset: null };
  }

  const limit = parseInt(limitRaw, 10);
  if (!Number.isFinite(limit) || limit <= 0) {
    return { ok: false, limit: null, offset: null };
  }

  if (pageRaw === undefined) {
    return { ok: true, limit, offset: 0 };
  }

  const page = parseInt(pageRaw, 10);
  if (!Number.isFinite(page) || page <= 0) {
    return { ok: false, limit: null, offset: null };
  }

  return {
    ok: true,
    limit,
    offset: (page - 1) * limit,
  };
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildMongoPredicate = (field, op, value) => {
  const normalizedOp = normalizeOperator(op);
  if (!SUPPORTED_OPS.has(normalizedOp)) return null;
  if (!FIELD_RE.test(field) && field !== "_id" && field !== "id") return null;

  switch (normalizedOp) {
    case "eq":
      return { [field]: value };
    case "ne":
      return { [field]: { $ne: value } };
    case "gt":
      return { [field]: { $gt: value } };
    case "gte":
      return { [field]: { $gte: value } };
    case "lt":
      return { [field]: { $lt: value } };
    case "lte":
      return { [field]: { $lte: value } };
    case "contains":
    case "like":
      return {
        [field]: {
          $regex: escapeRegex(String(value)),
          $options: "i",
        },
      };
    case "in": {
      const values = toArray(value);
      return { [field]: { $in: values } };
    }
    case "nin": {
      const values = toArray(value);
      return { [field]: { $nin: values } };
    }
    default:
      return null;
  }
};

const mergeMongoAnd = (conditions) => {
  const valid = conditions.filter(Boolean);
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];
  return { $and: valid };
};

const buildMongoConditionFromObject = (condition) => {
  if (!isPlainObject(condition)) return null;

  if ("field" in condition) {
    return buildMongoPredicate(
      condition.field,
      condition.op || "eq",
      parseValue(condition.value)
    );
  }

  const parts = [];

  if ("and" in condition) {
    const andRules = Array.isArray(condition.and) ? condition.and : null;
    if (!andRules || andRules.length === 0) return null;
    const andConditions = andRules.map(buildMongoConditionFromObject);
    if (andConditions.some((x) => !x)) return null;
    parts.push(mergeMongoAnd(andConditions));
  }

  if ("or" in condition) {
    const orRules = Array.isArray(condition.or) ? condition.or : null;
    if (!orRules || orRules.length === 0) return null;
    const orConditions = orRules.map(buildMongoConditionFromObject);
    if (orConditions.some((x) => !x)) return null;
    parts.push({ $or: orConditions });
  }

  if ("not" in condition) {
    const notCondition = buildMongoConditionFromObject(condition.not);
    if (!notCondition) return null;
    parts.push({ $nor: [notCondition] });
  }

  const plainKeys = Object.keys(condition).filter(
    (key) => key !== "and" && key !== "or" && key !== "not"
  );

  for (const key of plainKeys) {
    const value = condition[key];
    const { field, op } = parseFieldOp(key);
    if (!FIELD_RE.test(field) && field !== "_id" && field !== "id") return null;

    if (isPlainObject(value) && !hasLogicalKeys(value) && !("field" in value)) {
      const nestedOps = Object.keys(value);
      if (nestedOps.length === 0) return null;
      const nestedPredicates = nestedOps.map((nestedOp) =>
        buildMongoPredicate(field, nestedOp, parseValue(value[nestedOp]))
      );
      if (nestedPredicates.some((x) => !x)) return null;
      parts.push(mergeMongoAnd(nestedPredicates));
      continue;
    }

    const predicate = buildMongoPredicate(field, op, parseValue(value));
    if (!predicate) return null;
    parts.push(predicate);
  }

  return mergeMongoAnd(parts);
};

const buildMongoSort = (sortValue) => {
  if (!sortValue) return { ok: true, sort: null };

  const descriptors = String(sortValue)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (descriptors.length === 0) return { ok: true, sort: null };

  const sort = {};
  for (const descriptor of descriptors) {
    const desc = descriptor.startsWith("-");
    const field = desc ? descriptor.slice(1) : descriptor;
    if (!FIELD_RE.test(field) && field !== "_id" && field !== "id") {
      return { ok: false, sort: null };
    }
    sort[field] = desc ? -1 : 1;
  }
  return { ok: true, sort };
};

const buildMongoPushdown = (query) => {
  const safeQuery = clone(query);
  const residualQuery = {};
  const conditions = [];

  if (safeQuery._where !== undefined) {
    const rawWhere = safeQuery._where;
    const parsedWhere =
      typeof rawWhere === "string"
        ? (() => {
            try {
              return JSON.parse(rawWhere);
            } catch {
              return null;
            }
          })()
        : rawWhere;

    const whereCondition = buildMongoConditionFromObject(parsedWhere);
    if (whereCondition) {
      conditions.push(whereCondition);
    } else {
      residualQuery._where = rawWhere;
    }
  }

  for (const key of Object.keys(safeQuery)) {
    if (CONTROL_KEYS.has(key)) continue;
    if (key.startsWith("_")) {
      residualQuery[key] = safeQuery[key];
      continue;
    }
    const { field, op } = parseFieldOp(key);
    const predicate = buildMongoPredicate(field, op, parseValue(safeQuery[key]));
    if (!predicate) {
      residualQuery[key] = safeQuery[key];
      continue;
    }
    conditions.push(predicate);
  }

  const sortPlan = buildMongoSort(safeQuery._sort);
  if (!sortPlan.ok && safeQuery._sort !== undefined) {
    residualQuery._sort = safeQuery._sort;
  }

  const pagingPlan = buildPagination(safeQuery);
  let limit = null;
  let offset = null;
  if (!pagingPlan.ok) {
    if (safeQuery._page !== undefined) residualQuery._page = safeQuery._page;
    if (safeQuery._pageSize !== undefined) residualQuery._pageSize = safeQuery._pageSize;
    if (safeQuery._per_page !== undefined) residualQuery._per_page = safeQuery._per_page;
    if (safeQuery._limit !== undefined) residualQuery._limit = safeQuery._limit;
  } else {
    limit = pagingPlan.limit;
    offset = pagingPlan.offset;
  }

  if (safeQuery._embed !== undefined) {
    residualQuery._embed = safeQuery._embed;
  }

  const hasResidualFiltering = Object.keys(residualQuery).some(
    (key) => key !== "_embed"
  );
  if (hasResidualFiltering && limit !== null && limit !== undefined) {
    if (safeQuery._page !== undefined) residualQuery._page = safeQuery._page;
    if (safeQuery._pageSize !== undefined) residualQuery._pageSize = safeQuery._pageSize;
    if (safeQuery._per_page !== undefined) residualQuery._per_page = safeQuery._per_page;
    if (safeQuery._limit !== undefined) residualQuery._limit = safeQuery._limit;
    limit = null;
    offset = null;
  }

  return {
    filter: mergeMongoAnd(conditions) || {},
    sort: sortPlan.ok ? sortPlan.sort : null,
    limit,
    offset,
    residualQuery,
  };
};

const buildSqlPushdown = (query, { dialect }) => {
  const safeQuery = clone(query);
  const residualQuery = {};
  const whereParts = [];

  if (safeQuery._where !== undefined) {
    const rawWhere = safeQuery._where;
    const parsedWhere =
      typeof rawWhere === "string"
        ? (() => {
            try {
              return JSON.parse(rawWhere);
            } catch {
              return null;
            }
          })()
        : rawWhere;

    const whereSql = buildConditionFromObject(dialect, parsedWhere);
    if (whereSql) {
      whereParts.push(`(${whereSql})`);
    } else {
      residualQuery._where = rawWhere;
    }
  }

  for (const key of Object.keys(safeQuery)) {
    if (CONTROL_KEYS.has(key)) continue;
    if (key.startsWith("_")) {
      residualQuery[key] = safeQuery[key];
      continue;
    }
    const { field, op } = parseFieldOp(key);
    const predicate = buildPredicate(dialect, field, op, parseValue(safeQuery[key]));
    if (!predicate) {
      residualQuery[key] = safeQuery[key];
      continue;
    }
    whereParts.push(predicate);
  }

  const sortPlan = buildSortClause(dialect, safeQuery._sort);
  if (!sortPlan.ok && safeQuery._sort !== undefined) {
    residualQuery._sort = safeQuery._sort;
  }

  const pagingPlan = buildPagination(safeQuery);
  let limit = null;
  let offset = null;

  if (!pagingPlan.ok) {
    if (safeQuery._page !== undefined) residualQuery._page = safeQuery._page;
    if (safeQuery._pageSize !== undefined) residualQuery._pageSize = safeQuery._pageSize;
    if (safeQuery._per_page !== undefined) residualQuery._per_page = safeQuery._per_page;
    if (safeQuery._limit !== undefined) residualQuery._limit = safeQuery._limit;
  } else {
    limit = pagingPlan.limit;
    offset = pagingPlan.offset;
  }

  if (safeQuery._embed !== undefined) {
    residualQuery._embed = safeQuery._embed;
  }

  const hasResidualFiltering = Object.keys(residualQuery).some(
    (key) => key !== "_embed"
  );
  if (hasResidualFiltering && limit !== null && limit !== undefined) {
    if (safeQuery._page !== undefined) residualQuery._page = safeQuery._page;
    if (safeQuery._pageSize !== undefined) residualQuery._pageSize = safeQuery._pageSize;
    if (safeQuery._per_page !== undefined) residualQuery._per_page = safeQuery._per_page;
    if (safeQuery._limit !== undefined) residualQuery._limit = safeQuery._limit;
    limit = null;
    offset = null;
  }

  return {
    where: whereParts.length > 0 ? whereParts.join(" AND ") : "",
    orderBy: sortPlan.ok ? sortPlan.sql : "",
    limit,
    offset,
    residualQuery,
  };
};

module.exports = {
  buildSqlPushdown,
  buildMongoPushdown,
};
