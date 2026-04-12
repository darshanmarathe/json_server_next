const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const { getPaginatedItems, UUID } = require("../common/index");
const { buildSqlPushdown } = require("../common/queryPushdown");

const db = {
  conn: null,
  dataFolder: null,
  dbPath: null,
  tables: [],
};

const normalizeBody = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }
  return { ...body };
};

const Santize = (param = "") =>
  String(param).replace(/[^a-zA-Z0-9_]/g, "");

const getTableName = (tableName) => "MJS_" + Santize(tableName).toUpperCase();

const openConnection = () => {
  if (db.conn) return db.conn;
  db.conn = new sqlite3.Database(db.dbPath);
  return db.conn;
};

const runAsync = (sqlText, params = []) =>
  new Promise((resolve, reject) => {
    openConnection().run(sqlText, params, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });

const allAsync = (sqlText, params = []) =>
  new Promise((resolve, reject) => {
    openConnection().all(sqlText, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows || []);
    });
  });

const getAsync = (sqlText, params = []) =>
  new Promise((resolve, reject) => {
    openConnection().get(sqlText, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row || null);
    });
  });

const parseDocument = (row) => {
  let doc = {};
  if (row && row.document) {
    try {
      doc = JSON.parse(row.document);
    } catch {
      doc = {};
    }
  }
  return {
    ...doc,
    _id: row ? row._id : null,
  };
};

const createTable = async (collectionName) => {
  if (!collectionName) return;
  const table = getTableName(collectionName);
  await runAsync(
    `CREATE TABLE IF NOT EXISTS ${table} (
      _id TEXT PRIMARY KEY,
      document TEXT NOT NULL
    )`
  );
};

const initDb = async (collectionName) => {
  if (!collectionName) return true;
  if (!db.tables.includes(collectionName)) {
    await createTable(collectionName);
    db.tables.push(collectionName);
  }
  return true;
};

const Init = () => {
  try {
    db.dataFolder = process.env.DATA_FOLDER || "./data";
    db.dbPath =
      process.env.SQLITE_PATH || path.join(db.dataFolder, "sqlite.db");

    if (!fs.existsSync(db.dataFolder)) {
      fs.mkdirSync(db.dataFolder, { recursive: true });
    }

    openConnection();
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

const GetData = async ({ type }, query) => {
  await initDb(type);
  const table = getTableName(type);
  const rows = await allAsync(`SELECT * FROM ${table}`);
  const items = rows.map(parseDocument);
  return getPaginatedItems(items, query);
};

const GetDataWithQuery = async ({ type }, query) => {
  await initDb(type);
  const table = getTableName(type);
  const plan = buildSqlPushdown(query, { dialect: "sqlite" });

  let queryText = `SELECT * FROM ${table}`;
  if (plan.where) {
    queryText += ` WHERE ${plan.where}`;
  }
  if (plan.orderBy) {
    queryText += ` ORDER BY ${plan.orderBy}`;
  }
  if (plan.limit !== null && plan.limit !== undefined) {
    const limit = parseInt(plan.limit, 10);
    const offset = parseInt(plan.offset || 0, 10);
    queryText += ` LIMIT ${limit} OFFSET ${offset}`;
  }

  const rows = await allAsync(queryText);
  return {
    items: rows.map(parseDocument),
    residualQuery: plan.residualQuery,
  };
};

const GetDataById = async ({ type, id }) => {
  await initDb(type);
  const table = getTableName(type);
  const row = await getAsync(`SELECT * FROM ${table} WHERE _id = ?`, [id]);
  if (!row) return null;
  return parseDocument(row);
};

const CollectionList = async () => {
  const rows = await allAsync(
    "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'MJS_%'"
  );
  return rows
    .map((x) => String(x.name || ""))
    .filter((name) => name.startsWith("MJS_"))
    .map((name) => name.replace("MJS_", "").toLowerCase());
};

const Create = async (type, body) => {
  await initDb(type);
  const table = getTableName(type);

  const document = normalizeBody(body);
  const id = document._id || UUID();
  delete document._id;
  if (!document._createdOn) {
    document._createdOn = new Date().toISOString();
  }

  await runAsync(`INSERT INTO ${table} (_id, document) VALUES (?, ?)`, [
    id,
    JSON.stringify(document),
  ]);

  return {
    ...document,
    _id: id,
  };
};

const Update = async (type, body, id) => {
  await initDb(type);
  const table = getTableName(type);

  const document = normalizeBody(body);
  delete document._id;
  document._updatedOn = new Date().toISOString();

  const result = await runAsync(
    `UPDATE ${table} SET document = ? WHERE _id = ?`,
    [JSON.stringify(document), id]
  );
  if (result.changes === 0) return null;
  return {
    ...document,
    _id: id,
  };
};

const Delete = async (type, id) => {
  await initDb(type);
  const table = getTableName(type);
  await runAsync(`DELETE FROM ${table} WHERE _id = ?`, [id]);
};

module.exports = {
  Init,
  GetData,
  GetDataWithQuery,
  GetDataById,
  CollectionList,
  Create,
  Update,
  Delete,
};
