var repo = null;
var Cache = null
const Init = (_repo , _cache) => {
  repo = _repo;
  Cache = _cache;  
}

const Index = async (req, res) => {
  let listOfCollections = Cache.CollectionList();
  if(!listOfCollections){
    listOfCollections = await repo.CollectionList();
    Cache.Set('collectionList', listOfCollections);
  } 
   
  listOfCollections = listOfCollections.filter((x) => x.toLowerCase() !== "admin")
  let html = `
    <h1> Routes already available</h1>
    <hr>
    <ul>
      ${listOfCollections.map(x => `<li><a href="/${x}">/${x}</a></li>`).join('')}
    </ul>
      `
  res.send(html)
}


const Get = async (req, res) => {
  if(req.params.type.toUpperCase() === 'FAVICON.ICO') 
  {
        res.send(null);
      return;
    }
  let items = await Cache.GetData(req.params, req.query)
  console.log(items)
  if(!items){
    items = await repo.GetData(req.params, req.query);
    const { type } = req.params;
    Cache.Set(type, items); 
  }  
  
  res.send(items);
}
const GetById = async (req, res) => {
  let item = await Cache.GetDataById(req.params);
  if(!item){
    item = await repo.GetDataById(req.params);
    const { type, id } = req.params;
    Cache.Set(`${type}_${id}`, item);
  }
  if (typeof item === 'object')
    res.send(item);
  else
    res.sendStatus(item);
}
const Post = async (req, res) => {
  let { type } = req.params;
  try {
    const item = await repo.Create(type, req.body);
    res.send(item);
    Cache.Set(`${type}_${item._id}`, item);
  } catch (error) {
    res.send(error);
  }
}
const Put = async (req, res) => {
  let { type, id } = req.params;
  if (req.body.id) delete req.body.id;
  try {
    let obj = await repo.Update(type, req.body, id);
    Cache.Set(`${type}_${id}`, obj);
    res.send(obj);
  } catch (error) {
    res.send(error);
  }
}
const Delete = async (req, res) => {
  let { type, id } = req.params;
  await repo.Delete(type, id);
  Cache.Destroy(type)
  Cache.Destroy(`${type}_${id}`)
  
  res.send("Deleted.");
}


module.exports = {
  Init,
  Index,
  Get,
  GetById,
  Post,
  Put,
  Delete
}