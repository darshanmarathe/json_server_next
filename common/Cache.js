const NodeCache = require( "node-cache" );
var Cache = null;
log = console.log;

// Connection URL
const TTL = parseInt((process.env.CACHE_TTL || '1'));

var db = null
var collections = null

var initDb = (collectionName) => {

}

const Init = () => {
    log('Cache.TTl:', TTL)
    Cache = new NodeCache( { stdTTL: TTL } );
    return true;
}
const GetData = async ({
    type
}, query) => {
    initDb(type)
    return Cache.get(type);
}
const GetDataById = async ({
    type,
    id
}) => {
    initDb(type)
  return Cache.get(`${type}_${id}`);
}
const CollectionList = () => {
    return Cache.get('collectionList');
}


const Set = (key , value) => {
    
    Cache.set(key, value);
    log("Cache.set:" , key, value)
    if(key.indexOf('_') > -1)
    {
        Destroy(key.split('_')[0])
    }
}

const Destroy = (key) => {
    Cache.take(key);
    log("Cache.remove:" , key)
}

module.exports = {
    Init,
    GetData,
    GetDataById,
    CollectionList,
    Set,
    Destroy
}