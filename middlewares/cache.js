const _cache = require('../common/Cache.js');
const { GET } = require('../common/Hypermedia');

const deepClone = (value) => JSON.parse(JSON.stringify(value));

async function CacheGet(req , res, next) {
    if(req.params.type.toUpperCase() === 'FAVICON.ICO') 
    {
          res.send(null);
        return;
      }
    // Query options are handled in the controller so advanced filters/sort/embed remain correct.
    if(req.query && Object.keys(req.query).length > 0) {
        next();
        return;
    }
    let items = await _cache.GetData(req.params, {})
    if(!items){
    next();
    } else {
        console.log('sent from middleware cache')
        let responseItems = Array.isArray(items) ? deepClone(items) : items;
        const type = req.params.type;
        if (Array.isArray(responseItems) && req[type + "_data"] && req[type + "_data"].hypermedia) {
            responseItems = GET(type, responseItems);
        }
        res.send(responseItems)
    }
}
async function CacheGetById(req , res, next) {
    let item = await _cache.GetDataById(req.params);
    if(!item){
        next();
    }else{
        console.log("send from cache by id middleware")
        res.send(item)
    }
}
module.exports = {
    CacheGet, 
    CacheGetById
}
