const {
    getPaginatedItems,
    UUID
} = require('../common/index');
const postgres = require('postgres')

const url = process.env.CONNECTION_STRING || 'postgresql://localhost:5432';

let sql = null;
var initDb = async (collectionName) => {
    return await createTable(collectionName)
}

var createTable = async (tableName) => {
    if(tableName === '') return;
    let _tableName = "MJS_" + tableName.toUpperCase();
   
    console.log(`CREATE TABLE IF NOT EXISTS ${_tableName} (
        ID UUID PRIMARY KEY,
        document JSON
     );`)
    return sql`CREATE TABLE IF NOT EXISTS ${_tableName} (
        ID UUID PRIMARY KEY,
        document JSON
     );`

}

const Init = async () => {
    console.log('initing postgress', url)
    try {
        sql = await postgres(url);
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
    return new Promise((res, rej) => {});

}
const GetDataById = ({
    type,
    id
}) => {
    initDb(type)
    return new Promise((res, rej) => {
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

const Create = (type, body) => {
    initDb(type)
    let item = body;
    return new Promise((res, rej) => {

    })
}
const Update = (type, body, id) => {
    initDb(type)
    return new Promise((res, rej) => {

    })
}
const Delete = (type, id) => {
    initDb(type)

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