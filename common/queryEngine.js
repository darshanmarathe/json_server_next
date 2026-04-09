const _ = require("lodash");
const { getPaginatedItems } = require("./pager");

const CONTROL_QUERY_KEYS = new Set([
  "_sort",
  "_page",
  "_pageSize",
  "_per_page",
  "_limit",
  "_embed",
  "_where",
]);

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const parseValue = (value) => {
  if (Array.isArray(value)) return value.map(parseValue);
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;

  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];
  if (
    (firstChar === "{" && lastChar === "}") ||
    (firstChar === "[" && lastChar === "]")
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber)) return asNumber;
  return trimmed;
};

const normalizeComparable = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return "";

    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) return asNumber;
    return trimmed.toLowerCase();
  }
  return value;
};

const compareValues = (left, right) => {
  const a = normalizeComparable(left);
  const b = normalizeComparable(right);

  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (a > b) return 1;
  if (a < b) return -1;
  return String(a).localeCompare(String(b));
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((x) => parseValue(x.trim()))
      .filter((x) => x !== "");
  }
  if (value === undefined || value === null) return [];
  return [value];
};

const applyOperator = (left, op, right) => {
  const operator = String(op || "eq").toLowerCase();

  switch (operator) {
    case "eq":
    case "is":
      return compareValues(left, right) === 0;
    case "ne":
    case "neq":
      return compareValues(left, right) !== 0;
    case "gt":
      return compareValues(left, right) > 0;
    case "gte":
      return compareValues(left, right) >= 0;
    case "lt":
      return compareValues(left, right) < 0;
    case "lte":
      return compareValues(left, right) <= 0;
    case "in": {
      const values = toArray(right);
      return values.some((val) => compareValues(left, val) === 0);
    }
    case "nin": {
      const values = toArray(right);
      return values.every((val) => compareValues(left, val) !== 0);
    }
    case "contains": {
      if (Array.isArray(left)) {
        return left.some((item) => compareValues(item, right) === 0);
      }
      if (typeof left === "string") {
        return left.toLowerCase().includes(String(right).toLowerCase());
      }
      return false;
    }
    case "like": {
      if (left === null || left === undefined) return false;
      return String(left).toLowerCase().includes(String(right).toLowerCase());
    }
    default:
      return compareValues(left, right) === 0;
  }
};

const parseFieldAndOp = (key) => {
  const idx = key.lastIndexOf(":");
  if (idx <= 0) return { field: key, op: "eq" };
  return {
    field: key.slice(0, idx),
    op: key.slice(idx + 1) || "eq",
  };
};

const matchesObjectCondition = (item, condition) => {
  if (!condition || typeof condition !== "object") return true;

  if ("field" in condition) {
    const field = condition.field;
    const op = condition.op || "eq";
    const value = condition.value;
    return applyOperator(_.get(item, field), op, value);
  }

  if ("and" in condition) {
    const andRules = Array.isArray(condition.and) ? condition.and : [];
    if (!andRules.every((rule) => matchesObjectCondition(item, rule))) return false;
  }
  if ("or" in condition) {
    const orRules = Array.isArray(condition.or) ? condition.or : [];
    if (!orRules.some((rule) => matchesObjectCondition(item, rule))) return false;
  }
  if ("not" in condition) {
    if (matchesObjectCondition(item, condition.not)) return false;
  }

  const keys = Object.keys(condition).filter(
    (key) => key !== "and" && key !== "or" && key !== "not"
  );

  for (const key of keys) {
    const { field, op } = parseFieldAndOp(key);
    const actual = _.get(item, field);
    const expected = condition[key];

    if (
      expected &&
      typeof expected === "object" &&
      !Array.isArray(expected) &&
      !("field" in expected) &&
      !("and" in expected) &&
      !("or" in expected) &&
      !("not" in expected)
    ) {
      for (const nestedOp of Object.keys(expected)) {
        if (!applyOperator(actual, nestedOp, expected[nestedOp])) return false;
      }
      continue;
    }

    if (!applyOperator(actual, op, expected)) return false;
  }

  return true;
};

const applyWhere = (items, rawWhere) => {
  if (!rawWhere) return items;

  let where = rawWhere;
  if (typeof rawWhere === "string") {
    try {
      where = JSON.parse(rawWhere);
    } catch {
      return items;
    }
  }

  return items.filter((item) => matchesObjectCondition(item, where));
};

const applyFieldFilters = (items, query) => {
  let result = items;

  for (const key of Object.keys(query || {})) {
    if (CONTROL_QUERY_KEYS.has(key)) continue;
    if (key.startsWith("_")) continue;

    const { field, op } = parseFieldAndOp(key);
    const expected = parseValue(query[key]);
    result = result.filter((item) => {
      const actual = _.get(item, field);
      return applyOperator(actual, op, expected);
    });
  }

  return result;
};

const applySort = (items, sortValue) => {
  if (!sortValue) return items;
  const fields = String(sortValue)
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  if (fields.length === 0) return items;

  return [...items].sort((a, b) => {
    for (const descriptor of fields) {
      const desc = descriptor.startsWith("-");
      const field = desc ? descriptor.slice(1) : descriptor;
      const cmp = compareValues(_.get(a, field), _.get(b, field));
      if (cmp !== 0) return desc ? -cmp : cmp;
    }
    return 0;
  });
};

const applyPagination = (items, query) => {
  const hasPaging =
    query &&
    (query._page !== undefined ||
      query._pageSize !== undefined ||
      query._per_page !== undefined ||
      query._limit !== undefined);
  if (!hasPaging) return items;

  const page = parseInt(query._page, 10);
  const perPage = parseInt(
    query._per_page || query._pageSize || query._limit,
    10
  );

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePerPage =
    Number.isFinite(perPage) && perPage > 0 ? perPage : items.length || 1;

  return getPaginatedItems(items, { _page: safePage, _pageSize: safePerPage });
};

const singularize = (name) => {
  if (!name || typeof name !== "string") return name;
  if (name.endsWith("ies")) return name.slice(0, -3) + "y";
  if (name.endsWith("s")) return name.slice(0, -1);
  return name;
};

const getId = (item) => {
  if (!item || typeof item !== "object") return null;
  if (item._id !== undefined && item._id !== null) return String(item._id);
  if (item.id !== undefined && item.id !== null) return String(item.id);
  return null;
};

const getEmbedTargets = (embedQuery) => {
  if (!embedQuery) return [];
  if (Array.isArray(embedQuery)) {
    return embedQuery.map((x) => String(x).trim()).filter(Boolean);
  }
  return String(embedQuery)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
};

const applyEmbed = async (items, parentType, embedQuery, fetchCollectionData) => {
  const embeds = getEmbedTargets(embedQuery);
  if (embeds.length === 0) return items;
  if (typeof fetchCollectionData !== "function") return items;

  const singular = singularize(parentType);
  const fkCandidates = [
    `${singular}Id`,
    `${parentType}Id`,
    `${singular}_id`,
    `${parentType}_id`,
  ];

  for (const embedCollection of embeds) {
    const relatedRaw = await fetchCollectionData(embedCollection);
    const related = Array.isArray(relatedRaw) ? relatedRaw : [];
    const groups = {};

    for (const relatedItem of related) {
      let relationId = null;
      for (const fk of fkCandidates) {
        if (relatedItem[fk] !== undefined && relatedItem[fk] !== null) {
          relationId = String(relatedItem[fk]);
          break;
        }
      }
      if (!relationId) continue;
      if (!groups[relationId]) groups[relationId] = [];
      groups[relationId].push(relatedItem);
    }

    for (const item of items) {
      const id = getId(item);
      item[embedCollection] = id ? groups[id] || [] : [];
    }
  }

  return items;
};

const applyQueryOptions = async (
  sourceItems,
  query,
  { parentType, fetchCollectionData } = {}
) => {
  let items = Array.isArray(sourceItems) ? deepClone(sourceItems) : [];
  const safeQuery = query || {};

  items = applyWhere(items, safeQuery._where);
  items = applyFieldFilters(items, safeQuery);
  items = applySort(items, safeQuery._sort);
  items = applyPagination(items, safeQuery);
  items = await applyEmbed(items, parentType, safeQuery._embed, fetchCollectionData);

  return items;
};

module.exports = {
  applyQueryOptions,
};
