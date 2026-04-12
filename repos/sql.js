const { getPaginatedItems } = require("../common/index");
const { buildSqlPushdown } = require("../common/queryPushdown");

const url =
  process.env.CONNECTION_STRING ||
  "Server=.\\SQLEXPRESS,1433;Database=Min_JSON_Server;User Id=sa;Password=ds;Encrypt=true";
let tables = [];
const sql = require("mssql");

var initDb = async (collectionName) => {
  if (!tables.includes(collectionName)) {
    await createTable(collectionName);
  }
  return true;
};

//for SQL Injection as mssql package dose not add dynamic table names
const Santize = (param) => param.replace(/;/g , '').replace(/--/g , '').replace(/GO/g , '');

const getTableName = (tableName) => "MJS_" + Santize(tableName.toUpperCase());
var createTable = async (tableName) => {
  if (tableName === "") return;
  await sql.connect(url);
  let _tableName = getTableName(tableName);

  return await sql.query(`if not exists (select * from sysobjects where name='${_tableName}' and xtype='U')

  create table ${_tableName}
    (
        _id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        document nvarchar(max)
       
    )`);

 
};

const Init = async () => {
  try {
    console.log("initing sql server", url);
    await sql.connect(url);

    tables = await CollectionList();
    return true;
  } catch (error) {
    console.log(error);
    false;
  }
};


const GetData = async ({ type }, query) => {
  await initDb(type);
  let _tableName = getTableName(type);
  console.log(query);
  return new Promise((res, rej) => {
    sql.query(`SELECT * FROM ${_tableName}`).then((results) => {
      console.log(results);
      let unpaged = results.recordset.map(parseDocumentRow);
      res(getPaginatedItems(unpaged, query));
    });
  });
};

const parseDocumentRow = (row) => {
  let document = row.document;
  if (typeof document === "string") {
    try {
      document = JSON.parse(document);
    } catch {
      document = {};
    }
  }
  document = document || {};
  return {
    ...document,
    _id: row._Id || row._id,
  };
};

const GetDataWithQuery = async ({ type }, query) => {
  await initDb(type);
  const _tableName = getTableName(type);
  const plan = buildSqlPushdown(query, { dialect: "sqlserver" });

  let queryText = `SELECT * FROM ${_tableName}`;
  if (plan.where) {
    queryText += ` WHERE ${plan.where}`;
  }

  let orderByClause = plan.orderBy;
  if (!orderByClause && plan.limit !== null && plan.limit !== undefined) {
    orderByClause = `_id ASC`;
  }
  if (orderByClause) {
    queryText += ` ORDER BY ${orderByClause}`;
  }

  if (plan.limit !== null && plan.limit !== undefined) {
    const offset = parseInt(plan.offset || 0, 10);
    const limit = parseInt(plan.limit, 10);
    queryText += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
  }

  const results = await sql.query(queryText);
  return {
    items: results.recordset.map(parseDocumentRow),
    residualQuery: plan.residualQuery,
  };
};

const GetDataById = ({ type, id }) => {
  initDb(type);
  let _tableName = getTableName(type);
  return new Promise((res, rej) => {

    sql.query(`SELECT * FROM ${_tableName} 
        where _id = '${id}'`).then((results) => {
      res(
        results.recordset.map((x) => {
          return {
            ...JSON.parse(x.document),
            _id: x._id || x._Id,
          };
        })[0] || null
      );
    });
  });
};

const CollectionList = async () => {
  await sql.connect(url);

  let results = await sql.query`SELECT TABLE_NAME 
                                FROM INFORMATION_SCHEMA.TABLES 
                                WHERE TABLE_TYPE='BASE TABLE' 
                                ORDER BY TABLE_NAME`;

  console.log(results);
  let listofFolders = results.recordset
    .map((x) => x.TABLE_NAME)
    .map((z) => z.replace("MJS_", ""));
  return listofFolders;
};

const Create = async (type, body) => {
  await initDb(type);
  let _tableName = getTableName(type);
  return new Promise((res, rej) => {
    sql.query(`
        insert into ${_tableName} (document) 
        OUTPUT inserted._id
        values (
          '${JSON.stringify(body)}'	
        );`)
      .then((result) => {
        console.log("results", result.recordsets[0]);
        body._id = result.recordset[0]._id;
        res(body);
      })
      .catch((err) => {
        console.log(err);
        rej(err);
      });
  });
};

const Update = (type, body, id) => {
  initDb(type);
  

  let _tableName = getTableName(type);

  return new Promise((res, rej) => {
    sql.query(`update ${_tableName} set document ='${JSON.stringify(body)}' 
        WHERE _id = '${id}'`).then((result) => {
     console.log(result)  
         res(body);
    });
  });
};
const Delete = (type, id) => {
  initDb(type);

  let _tableName = getTableName(type);

  sql.query(`DELETE FROM ${_tableName} 
    where _id = '${id}'`).then((results) => {console.log(results)});
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
