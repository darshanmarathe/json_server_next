const fs = require("fs");
var Datastore = require('nedb');
const { getPaginatedItems, UUID } = require('../common/index');

let db = {};
var initDb = (collectionName) => {
    if (!(collectionName in db)) {
        db[collectionName] = new Datastore(`${db.dataFolder}/${collectionName}.db`);
        db[collectionName].loadDatabase();
    }
}

const Init = () => {
    db.dataFolder = process.env.DATA_FOLDER || './data';
    console.log('Data Folder Selected :', db.dataFolder)
    fs.existsSync(db.dataFolder) || fs.mkdirSync(db.dataFolder);
    return true;
}
const GetData = ({ type }, query) => {
    initDb(type)
    return new Promise((res, rej) => {
        if (type in db) {
            db[type].find({}, (err, docs) => {
                if (err) rej(err);
                const result = getPaginatedItems(docs, query);
                res(result);
            });
        } else {
            rej(new Error("collection dose not exist."));
        }
    });

}
const GetDataById = ({
    type,
    id
}) => {
    initDb(type)
    return new Promise((res, rej) => {
        if (type in db) {
            db[type].find({ _id: id }, (err, docs) => {
                if (err) rej(err);
                res(docs);
            });
        } else {
            rej(new Error("collection dose not exist."));
        }
    });
}
const CollectionList = () => {
    let listOfFolders = [];

    const files = fs.readdirSync(db.dataFolder);

    console.log(files)
    for (const file of files) {

        if (file.indexOf('.db') >= 0)
            listOfFolders.push(file.replace('.db', ''));
    }
    return listOfFolders;
}
const Create = (type, body) => {
    initDb(type)
    let item = body;
    return new Promise((res, rej) => {
        db[type].insert(item, (err, newDoc) => {
            if (err) rej(err);
            res(newDoc);
        })
    })
}
const Update = (type, body, id) => {
    initDb(type)
    return new Promise((res, rej) => {
        db[type].update({ _id: id }, body, {}, function () {
            res(body)
        });

    })
}
const Delete = (type, id) => {
    initDb(type)

    db[type].remove({ _id: id }, {}, function (err, numRemoved) {
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