var repo = null;
var Cache = null;
const path = require('path')
const { applyQueryOptions } = require('../common/queryEngine')
const Init = (_repo, _cache) => {
  repo = _repo;
  Cache = _cache;
}

const {GET , GETBYID} = require('../common/Hypermedia')

const normalizeGetById = (item) => {
  if (Array.isArray(item)) return item[0] || null;
  return item;
}

const deepClone = (value) => JSON.parse(JSON.stringify(value));
const hasQueryParams = (query) =>
  query && typeof query === "object" && Object.keys(query).length > 0;

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
  const { type } = req.params;
  const query = req.query || {};
  let residualQuery = query;
  let items = null;
  let { cached, cacheTTL , hypermedia } = req[type + "_data"];

  if (hasQueryParams(query) && typeof repo.GetDataWithQuery === "function") {
    try {
      const pushed = await repo.GetDataWithQuery(req.params, query);
      if (pushed && Array.isArray(pushed.items)) {
        items = pushed.items;
        residualQuery = pushed.residualQuery || {};
      }
    } catch (error) {
      console.log("query pushdown failed", error && error.message ? error.message : error);
    }
  }

  if (!items) {
    items = await Cache.GetData(req.params, {})
    if (!items) {
      items = await repo.GetData(req.params, {});
      if (cached) {
        Cache.Set(type, items, cacheTTL);
      } else {
        Cache.Set(type, items);
      }
    } else {
      console.log("retrived from cache");
    }
  }

  items = await applyQueryOptions(items, residualQuery, {
    parentType: type,
    fetchCollectionData: async (embedType) => {
      let relatedItems = await Cache.GetData({ type: embedType }, {});
      if (!relatedItems) {
        relatedItems = await repo.GetData({ type: embedType }, {});
        Cache.Set(embedType, relatedItems);
      }
      return Array.isArray(relatedItems) ? deepClone(relatedItems) : [];
    },
  });

  if (hypermedia) {
    items = GET(type , items);
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
const Patch = async (req, res, next) => {
  let { type, id } = req.params;
  if (req.body.id) delete req.body.id;
  if (req.body._id) delete req.body._id;

  try {
    let current = await repo.GetDataById({ type, id });
    current = normalizeGetById(current);

    if (!current || current === 404) {
      res.sendStatus(404);
      next();
      return;
    }

    const merged = Object.assign({}, current, req.body);
    let obj = await repo.Update(type, merged, id);
    obj = obj || merged;

    let { cached, cacheTTL, hypermedia } = req[type + "_data"];
    if (hypermedia) {
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
  Patch,
  Delete,
  Realtime
}
