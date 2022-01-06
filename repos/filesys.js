const fs = require('fs');
const _ = require("lodash")


function createFile(type, body) {
    let item = body;
    const has_id = "id" in item;
    let id = has_id ? item.id : UUID();

    body.id = id;
    body._createdOn = new Date();
    return new Promise((res, rej) => {
        CreatefolderIfNotExist(type);
        if (fs.existsSync(`./data/${type}/${id}.json`)) {
            rej(new Error("record already exist."));
        }
        fs.writeFileSync(`./data/${type}/${id}.json`, JSON.stringify(body));
        res(body);
    });
}

function updateFile(type, body, id) {
    body._updatedOn = new Date();
    return new Promise(async (res, rej) => {
        if (fs.existsSync(`./data/${type}/${id}.json`)) {
            const file = await readfileContent({
                type,
                id
            });
            let obj = Object.assign({}, file, body);
            console.log(obj);
            fs.writeFileSync(`./data/${type}/${id}.json`, JSON.stringify(obj));

            res(obj);
        }
        rej(new Error("record dose not exist."));
    });
}

function deleteFile(type, id) {
    fs.unlinkSync(`./data/${type}/${id}.json`);
}

function readFolderContent({
    type
}) {
    let result = [];
    CreatefolderIfNotExist(type)
    return new Promise((res, rej) => {
        let files = fs.readdirSync(`./data/${type}/`);
        for (const file of files) {
            let data = fs.readFileSync(`./data/${type}/${file}`);
            try {
                let record_data = JSON.parse(data);
                result.push(record_data);
            } catch {

            }
        }
        res(result);
    });
}

function CreatefolderIfNotExist(type) {
    console.log(`./data/${type}`);
    if (!fs.existsSync(`./data/${type}`)) {
        fs.mkdirSync(`./data/${type}`);
    }
}

function readfileContent({
    type,
    id
}) {
    return new Promise((res, rej) => {
        if (fs.existsSync(`./data/${type}/${id}.json`)) {
            fs.readFile(`./data/${type}/${id}.json`, (err, data) => {
                if (err) rej(err);
                let record_data = JSON.parse(data);
                res(record_data);
            });
        } else {
            return res(404)
        }
    });
}

function getPaginatedItems(items, {
    _page,
    _pageSize
}) {
    var pg = _page || 1,
        pgSize = _pageSize || items.length,
        offset = (pg - 1) * pgSize,
        pagedItems = _.drop(items, offset).slice(0, pgSize);
    return pagedItems;
}

function UUID() {
    var dt = new Date().getTime();
    var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
        }
    );
    return uuid;
}

function CollectionList() {
    let listOfFolders = [];
    const dir = './data/'
    const files = fs.readdirSync(dir)

    for (const file of files) {
        if (file.indexOf('.') === -1)
            listOfFolders.push(file)
    }
    return listOfFolders;
}

function init() {
    try {
        fs.existsSync('./data') || fs.mkdirSync('./data');
        return true;
    } catch (error) {
        console.log(error);
        return false
    }
}
module.exports = {
    init,
    GetData: readFolderContent,
    GetDataById : readfileContent,
    GetPaginatedItems: getPaginatedItems,
    CollectionList,
    Create : createFile,
}