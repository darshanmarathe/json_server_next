const {
    getPaginatedItems
} = require('../common/index');
const postgres = require('postgres')

const url = process.env.CONNECTION_STRING || 'postgresql://localhost:5432';
let tables = []
let sql = null;
var initDb = async (collectionName) => {
    if (!tables.includes(collectionName)) {
        await createTable(collectionName)
    }
    return true;
}


const getTableName = (tableName) => "MJS_" + tableName.toUpperCase();
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

const Init = async () => {
    console.log('initing postgress', url)
    try {
        sql = await postgres(url);
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
           let unpaged =results.map(x => {
            return {
                ...x.document,
                _id: x._id
            }
        });
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

            res(results.map(x => {
                return {
                    ...x.document,
                    _id: x._id
                }
            }))
        });

    });
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
    GetDataById,
    CollectionList,
    Create,
    Update,
    Delete,
}