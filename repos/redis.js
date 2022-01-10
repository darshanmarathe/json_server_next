const { getPaginatedItems, ID } = require('../common/index');

const { createClient } = require('redis');

var client = null;


let url = process.env.REDIS_URL || 'redis://localhost:6379';
let username = process.env.REDIS_USERNAME || null;
let password = process.env.REDIS_PWD || null;


if (username && username.trim() === "") {
    username: null
}


if (password && password.trim() === "") {
    password: null
}

let ttl = 5000
if (process.env.REDIS_TTL)
    ttl = parseInt(process.env.REDIS_TTL) || -1;




const getKey = (collectionName, id = ID()) => {
    return `MJS:${collectionName}:${id}`
}


const initDb = async (collectionName) => {
    if (!client.isOpen) await client.connect()

    console.log("Connection :", client.isOpen)
}

const Init = async () => {
    const userObj = {
        url,
        username,
        password
    }
    console.log(userObj);
    client = await createClient(userObj);

    console.log('redis client connected ... ttl is set to', client);
}
const GetData = async ({
    type
}, query) => {
    await initDb();
    let keys = await client.keys(`MJS:${type}:*`)
    let result = keys.map(async (x) => {
        const res = await client.get(x);
        return JSON.parse(res)
    })
    result = await Promise.all(result)
    return result;
}
const GetDataById = async ({
    type,
    id
}) => {
    const key = getKey(type, id);
    try {
        await initDb();
        let obj = await client.get(key)
        obj = JSON.parse(obj)
        console.log(obj);
        return obj
    } catch (error) {
        console.log(error)
    }
}
const CollectionList = async () => {
    await initDb();
    let keys = await client.keys("MJS:*")
    keys = keys.map(x => x.split(":")[1])
    return keys;
}
const Create = async (type, body) => {
    const key = getKey(type);
    body._id = key.split(':')[2];
    body.createdOn = new Date();
    try {
        await initDb();
        await client.set(key, JSON.stringify(body), ttl)
    } catch (error) {
        console.log(error)
    }
    console.log(body);
    return body;
}
const Update = async (type, body, id) => {
    await initDb();
    body.updatedOn = new Date();
    if (body._id === id) {
        await client.set(getKey(type, id), JSON.stringify(body))
    }
    return body;
}
const Delete = (type, id) => {
    initDb()
    client.del(getKey(type, id));
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