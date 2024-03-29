var repo = null;
var Cache = null;
const path = require('path')
const Init = (_repo, _cache) => {
  repo = _repo;
  Cache = _cache;
}

const {GET , GETBYID} = require('../common/Hypermedia')

const Index = async (req, res) => {
  let listOfCollections = Cache.CollectionList();
  if (!listOfCollections) {
    listOfCollections = await repo.CollectionList();
    Cache.Set('collectionList', listOfCollections);
  }

  res.send(listOfCollections)
}



const Realtime = async (req, res) => {
  res.sendFile(path.join(__dirname, '../realtime/index.html'));
}



const Get = async (req, res, next) => {
  if (req.params.type.toUpperCase() === 'FAVICON.ICO') {
    res.send(null);
    return;
  }
  let items = await Cache.GetData(req.params, req.query)

  if (!items) {
    items = await repo.GetData(req.params, req.query);
    const { type } = req.params;
    let { cached, cacheTTL , hypermedia } = req[type + "_data"];
    if (hypermedia) {
      items = GET(type , items);
    }
    if (cached) {

      Cache.Set(type, items, cacheTTL);
    } else {
      Cache.Set(type, items);
    }

  } else {
    console.log("retrived from cache");
  }
  
  //for post action middlewares
  res.Body = items;
  res.send(items);
  next();
}
const GetById = async (req, res, next) => {
  let item = await Cache.GetDataById(req.params);
  if (!item) {
    item = await repo.GetDataById(req.params);
    
    const { type, id } = req.params;
    let { cached, cacheTTL , hypermedia } = req[type + "_data"];
    if(hypermedia){
      item = GETBYID(type, item)
    }
    if (cached) {

      Cache.Set(`${type}_${id}`, item, cacheTTL);
    } else {
      Cache.Set(`${type}_${id}`, item);
    }

  }else{
    console.log("retrived from cache");
  }
  if (typeof item === 'object') {//for post action middlewares
    
    res.Body = item;
    res.send(item);
  }
  else
    res.sendStatus(item);

  next();
}
const Post = async (req, res, next) => {
  let { type } = req.params;
  try {
    const item = await repo.Create(type, req.body);
    //for post action middlewares
    
    let { cached, cacheTTL , hypermedia} = req[type + "_data"];
    if(hypermedia){
      GETBYID(type, item)
    }
    if (cached) {
      Cache.Set(`${type}_${item._id}`, item, cacheTTL);
      
    } else {
      Cache.Set(`${type}_${item._id}`, item);
    }
    res.Body = item;
    res.send(item);

  } catch (error) {
    res.send(error);
  }

  next();
}
const Put = async (req, res, next) => {
  let { type, id } = req.params;
  if (req.body.id) delete req.body.id;
  try {
    let obj = await repo.Update(type, req.body, id);
    let { cached, cacheTTL, hypermedia } = req[type + "_data"];
    if(hypermedia){
      GETBYID(type, obj)
    }
    if (cached) {

      Cache.Set(`${type}_${id}`, obj, cacheTTL);
    } else {

      Cache.Set(`${type}_${id}`, obj);
    }
    //for post action middlewares
    res.Body = obj;
    res.send(obj);
  } catch (error) {
    res.send(error);
  }

  next();
}
const Delete = async (req, res, next) => {
  let { type, id } = req.params;
  await repo.Delete(type, id);
  Cache.Destroy(type)
  Cache.Destroy(`${type}_${id}`)
  //for post action middlewares
  res.Body = 'Deleted';
  res.send("Deleted.");
  next();
}



module.exports = {
  Init,
  Index,
  Get,
  GetById,
  Post,
  Put,
  Delete,
  Realtime
}