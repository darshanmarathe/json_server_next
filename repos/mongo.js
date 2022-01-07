const fs = require("fs");
const pager = require('../common/pager');

const {
    MongoClient
} = require('mongodb');

// Connection URL
const url = process.env.CONNECTION_STRING || 'mongodb://localhost:27017';
const client = new MongoClient(url);

const ObjectId = require('mongodb').ObjectID;
// Database Name
const dbName = process.env.DB_NAME || 'mjserverDB';

var db = null
var collection = null

var initDb = (collectionName) => {
    collection = db.collection(collectionName);
}

const Init = () => {
    client.connect(function (err, connection) {
        if (err) console.log(err)
        db = client.db(dbName);

    })
    return true;
}
const GetData = async ({
    type
}, query) => {
    initDb(type)
    let items = await collection.find({}).toArray();
    console.log(items)
    const result = pager.getPaginatedItems(items, query);
    return result;
}
const GetDataById = async ({
    type,
    id
}) => {
    initDb(type)
    const res =  await collection.find({
        _id: ObjectId(id)
    }).toArray()
    console.log(res);
    return res[0] || null;
}
const CollectionList = () => {
    return new Promise((res, rej) => {
        db.listCollections().toArray(function (err, collInfos) {
            // collInfos is an array of collection info objects that look like:
            // { name: 'test', options: {} }
            res(collInfos.map(x => x.name));
        });
    })
}
const Create = async (type, body) => {
    initDb(type)
    let item = body;
    const res =  await collection.insertOne(item);
    body._id = res.insertedIds[0];
    return body;
}
const Update = async (type, body, id) => {
    initDb(type)

    delete body._id;
    const res = await  collection.updateOne({
            _id: ObjectId(id)
        }, { $set: body })

        body._id = id;
        return res.modifiedCount === 1 ? body : null;

    
}
const Delete = (type, id) => {
    initDb(type)

    collection.deleteMany({
        _id: ObjectId(id)
    }, {}, function (err, numRemoved) {
        // numRemoved = 1
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