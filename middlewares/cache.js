const _cache = require('../common/Cache.js');
async function CacheGet(req , res, next) {
    if(req.params.type.toUpperCase() === 'FAVICON.ICO') 
    {
          res.send(null);
        return;
      }
    let items = await _cache.GetData(req.params, req.query)
    if(!items){
    next();
    } else {
        console.log('sent from middleware cache')
        res.send(items)
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