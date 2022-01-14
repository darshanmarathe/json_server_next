const { getPaginatedItems } = require("../common/index");

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

const getTableName = (tableName) => "MJS_" + tableName.toUpperCase();
var createTable = async (tableName) => {
  if (tableName === "") return;
  await sql.connect(url);
  let _tableName = getTableName(tableName);

  console.log(`if not exists (select * from sysobjects where name='${_tableName}' and xtype='U')

  create table ${_tableName}
    (
        _Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        document nvarchar(max)
       
    )`);

  return await sql.query`if not exists (select * from sysobjects where name='${_tableName}' and xtype='U')

  create table ${_tableName}
    (
        _Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        document nvarchar(max)
       
    )`;

  return sql.query`create table ${_tableName}
  (
      _Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
      document nvarchar(max)
     
  )`;
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
    sql`SELECT * FROM ${_tableName}`.then((results) => {
      console.log(results);
      let unpaged = results.map((x) => {
        return {
          ...x.document,
          _id: x._id,
        };
      });
      res(getPaginatedItems(unpaged, query));
    });
  });
};
const GetDataById = ({ type, id }) => {
  initDb(type);
  let _tableName = getTableName(type);
  return new Promise((res, rej) => {
    console.log(sql(id));
    sql`SELECT * FROM ${sql(_tableName)} 
        where _id::text = ${sql(id).first}`.then((results) => {
      res(
        results.map((x) => {
          return {
            ...x.document,
            _id: x._id,
          };
        })
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
    sql`
        insert into ${sql(_tableName)} (document) values (
          ${sql.json(body)}	
        ) RETURNING _id`
      .then((result) => {
        console.log("results", result);
        body._id = result[0]._id;
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
    sql`update ${sql(_tableName)} set document = ${sql.json(body)} 
        WHERE _id::text = ${sql(id).first}  returning *`.then((result) => {
      const _res = result[0].document;
      _res._id = id;
      res(_res);
    });
  });
};
const Delete = (type, id) => {
  initDb(type);
  console.log(sql(id));
  let _tableName = getTableName(type);

  sql`DELETE FROM ${sql(_tableName)} 
    where _id::text = ${sql(id).first}`.then((results) => {});
};

module.exports = {
  Init,
  GetData,
  GetDataById,
  CollectionList,
  Create,
  Update,
  Delete,
};
