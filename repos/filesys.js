const fs = require('fs');
const { getPaginatedItems, UUID } = require('../common/index');

//Added now 

var db = {};
function createFile(type, body) {
    let item = body;
    const has_id = "_id" in item;
    let id = has_id ? item._id : UUID();

    body._id = id;
    body._createdOn = new Date();
    return new Promise((res, rej) => {
        CreatefolderIfNotExist(type);
        if (fs.existsSync(`${db.dataFolder}/${type}/${id}.json`)) {
            rej(new Error("record already exist."));
        }
        fs.writeFileSync(`${db.dataFolder}/${type}/${id}.json`, JSON.stringify(body));
        res(body);
    });
}

function updateFile(type, body, id) {
    body._updatedOn = new Date();
    return new Promise(async (res, rej) => {
        if (fs.existsSync(`${db.dataFolder}/${type}/${id}.json`)) {
            const file = await readfileContent({
                type,
                id
            });
            let obj = Object.assign({}, file, body);
            console.log(obj);
            fs.writeFileSync(`${db.dataFolder}/${type}/${id}.json`, JSON.stringify(obj));

            res(obj);
        }
        rej(new Error("record dose not exist."));
    });
}

function deleteFile(type, id) {
    fs.unlinkSync(`${db.dataFolder}/${type}/${id}.json`);
}

function readFolderContent({
    type
}, query) {
    let result = [];
    CreatefolderIfNotExist(type)
    return new Promise((res, rej) => {
        let files = fs.readdirSync(`${db.dataFolder}/${type}/`);
        for (const file of files) {
            let data = fs.readFileSync(`${db.dataFolder}/${type}/${file}`);
            try {
                let record_data = JSON.parse(data);
                result.push(record_data);
            } catch {

            }
        }
        result = getPaginatedItems(result, query);
        res(result);
    });
}

function CreatefolderIfNotExist(type) {
    console.log(`${db.dataFolder}/${type}`);
    if (!fs.existsSync(`${db.dataFolder}/${type}`)) {
        fs.mkdirSync(`${db.dataFolder}/${type}`);
    }
}

function readfileContent({
    type,
    id
}) {
    return new Promise((res, rej) => {
        if (fs.existsSync(`${db.dataFolder}/${type}/${id}.json`)) {
            fs.readFile(`${db.dataFolder}/${type}/${id}.json`, (err, data) => {
                if (err) rej(err);
                let record_data = JSON.parse(data);
                res(record_data);
            });
        } else {
            return res(404)
        }
    });
}



function CollectionList() {
    let listOfFolders = [];
    const dir = db.dataFolder + '/'
    const files = fs.readdirSync(dir)

    for (const file of files) {
        if (file.indexOf('.') === -1)
            listOfFolders.push(file)
    }
    return listOfFolders;
}

function Init() {
    try {
        db.dataFolder = process.env.DATA_FOLDER || './data';
        db.adminDataFolder = process.env.ADMIN_DATA_FOLDER || './admin_data';
        console.log('Data Folder Selected : ', db.dataFolder, db.adminDataFolder)
        fs.existsSync(db.dataFolder) || fs.mkdirSync(db.dataFolder);
        fs.existsSync(db.adminDataFolder) || fs.mkdirSync(db.adminDataFolder);
        return true;
    } catch (error) {
        console.log(error);
        return false
    }
}

function CollectionGet(collectionName) {
    return new Promise((res, rej) => {
        if (fs.existsSync(`${db.adminDataFolder}/${collectionName}.json`)) {
            fs.readFile(`${db.adminDataFolder}/${collectionName}.json`, (err, data) => {
                if (err) res({});
                let record_data = JSON.parse(data);
                res(record_data);
            });
        } else {
            return res(404)
        }
    });
}


function CollectionSet(collectionName, obj) {
    obj._updatedOn = new Date();
    return new Promise(async (res, rej) => {
        if (fs.existsSync(`${db.adminDataFolder}/${collectionName}.json`)) {
            const file = await CollectionGet(collectionName);
            let _obj = Object.assign({}, file, obj);
            console.log(_obj);

            fs.writeFileSync(`${db.adminDataFolder}/${collectionName}.json`, JSON.stringify(_obj));

            res(obj);
        }else {
            fs.writeFileSync(`${db.adminDataFolder}/${collectionName}.json`, JSON.stringify(obj));
            res(obj)
        }

       
    });
}

function UserGet(username) {

}

function UserSet(userObj) {
    
}


module.exports = {
    Init,
    GetData: readFolderContent,
    GetDataById: readfileContent,
    CollectionList,
    Create: createFile,
    Update: updateFile,
    Delete: deleteFile,
    CollectionGet,
    CollectionSet,
    UserGet: UserGet,
    UertSet: UserSet
}