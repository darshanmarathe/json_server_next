const {
    getPaginatedItems
} = require('../common/index');
const postgres = require('postgres')
const { buildSqlPushdown } = require('../common/queryPushdown');

const url = process.env.CONNECTION_STRING || 'postgresql://localhost:5432';
let tables = []
let sql = null;
const Santize = (param = '') =>
    String(param).replace(/[^a-zA-Z0-9_]/g, '');
var initDb = async (collectionName) => {
    if (!tables.includes(collectionName)) {
        await createTable(collectionName)
    }
    return true;
}


const getTableName = (tableName) => "MJS_" + Santize(tableName).toUpperCase();
var createTable = async (tableName) => {
    if (tableName === '') return;
    let _tableName = getTableName(tableName);

    console.log(sql `CREATE TABLE IF NOT EXISTS ${ sql(_tableName) } (
        _id uuid DEFAULT uuid_generate_v4 () PRIMARY KEY,
        document JSON
     );`)

    return sql `CREATE TABLE IF NOT EXISTS ${ sql(_tableName) } (
        _id uuid DEFAULT uuid_generate_v4 () PRIMARY KEY,
        document JSON
     );`

}

const parseDocument = (row) => {
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
        _id: row._id
    };
}

const Init = async () => {
    console.log('initing postgress', url)
    try {
        sql = await postgres(url , {
            idle_timeout: 2
          });
        tables = await CollectionList()
        return true

    } catch (error) {
        console.log(error)
        false;
    }
}

const GetData = ({
    type
}, query) => {

    initDb(type)
    let _tableName = getTableName(type);
console.log(query)
    return new Promise((res, rej) => {
        sql `SELECT * FROM ${ sql(_tableName) }`.then(results => {
           let unpaged =results.map(parseDocument);

            res(getPaginatedItems(unpaged , query))
        });
    });

}
const GetDataById = ({
    type,
    id
}) => {

    initDb(type)
    let _tableName = getTableName(type);
    return new Promise((res, rej) => {
        console.log(sql(id))
        sql `SELECT * FROM ${ sql(_tableName) } 
        where _id::text = ${ sql(id).first}`.then(results => {

            res(results.map(parseDocument))
        });

    });
}
const GetDataWithQuery = async ({ type }, query) => {
    await initDb(type);
    const _tableName = getTableName(type);
    const plan = buildSqlPushdown(query, { dialect: "postgres" });

    let queryText = `SELECT * FROM "${_tableName}"`;
    if (plan.where) {
        queryText += ` WHERE ${plan.where}`;
    }
    if (plan.orderBy) {
        queryText += ` ORDER BY ${plan.orderBy}`;
    }
    if (plan.limit !== null && plan.limit !== undefined) {
        queryText += ` LIMIT ${parseInt(plan.limit, 10)}`;
        const offset = parseInt(plan.offset || 0, 10);
        queryText += ` OFFSET ${offset}`;
    }

    const results = await sql.unsafe(queryText);
    return {
        items: results.map(parseDocument),
        residualQuery: plan.residualQuery,
    };
}
const CollectionList = async () => {
    let results = await sql `SELECT *
                            FROM pg_catalog.pg_tables
                            WHERE schemaname != 'pg_catalog' AND 
                                schemaname != 'information_schema';`

    let listofFolders = results.map(x => x.tablename)
        .map(z => z.replace('mjs_', ''));
    return listofFolders;
}

const Create = async (type, body) => {
    await initDb(type)
    let _tableName = getTableName(type);
    return new Promise((res, rej) => {

        sql `
        insert into ${ sql(_tableName) } (document) values (
          ${ sql.json(body) }	
        ) RETURNING _id`.then((result) => {
            console.log("results", result);
            body._id = result[0]._id;
            res(body)
        }).catch((err) => {
            console.log(err)
            rej(err)
        })
    })
}

const Update = (type, body, id) => {
    initDb(type)

    let _tableName = getTableName(type);

    return new Promise((res, rej) => {
        sql `update ${ sql(_tableName) } set document = ${ sql.json(body) } 
        WHERE _id::text = ${ sql(id).first}  returning *`.then(result => {
            const _res = result[0].document
            _res._id = id;
            res(_res);
        })
    })
}
const Delete = (type, id) => {
    initDb(type)
    console.log(sql(id))
    let _tableName = getTableName(type);

    sql `DELETE FROM ${ sql(_tableName) } 
    where _id::text = ${ sql(id).first}`.then(results => {

    });
}

module.exports = {
    Init,
    GetData,
    GetDataWithQuery,
    GetDataById,
    CollectionList,
    Create,
    Update,
    Delete,
}
