var repo = null;

const Init = (_repo) => {
  repo = _repo;
}

const Index = async (req, res) => {
  let listOfCollections = await repo.CollectionList();
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

  let items = await repo.GetData(req.params, req.query);
  res.send(items);
}
const GetById = async (req, res) => {
  let item = await repo.GetDataById(req.params);
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
  } catch (error) {
    res.send(error);
  }
}
const Put = async (req, res) => {
  let { type, id } = req.params;
  if (req.body.id) delete req.body.id;
  try {
    let obj = await repo.Update(type, req.body, id);
    res.send(obj);
  } catch (error) {
    res.send(error);
  }
}
const Delete = async (req, res) => {
  let { type, id } = req.params;
  await repo.Delete(type, id);
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