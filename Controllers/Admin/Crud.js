var repo = null

const collectionModel = require("../../common/collectionAttribute")
const Init = async (_repo) => {
  repo = _repo;
}
const Index = async (req, res) => {
  res.send("Admin UI in the makes")
}
const Get = async (req, res) => {
  let listOfCollections = await repo.CollectionList();
  listOfCollections = listOfCollections.filter((x) => x.toLowerCase() !== "admin")
  res.send(listOfCollections)
}
const GetById = async (req, res) => {
  const {id} =req.params;
  let collectionInfo =await repo.CollectionGet(id);
  console.log(collectionInfo)
  res.send(Object.keys(collectionInfo).length === 0  ? collectionModel(id) : collectionInfo );
}
const Post = async (req, res) => {
  const {name}  = req.body;
  console.log(name)
  await repo.CollectionSet(name , req.body);
  res.send(await repo.CollectionGet(name))
}
const Put = async (req, res) => {

}
const Delete = async (req, res) => {

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