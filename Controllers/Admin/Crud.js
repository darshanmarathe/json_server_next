var repo = null

const Init = async (_repo) => {
  repo = _repo;
}
const Index = async (req, res) => {

}
const Get = async (req, res) => {
  let listOfCollections = await repo.CollectionList();
  listOfCollections = listOfCollections.filter((x) => x.toLowerCase() !== "admin")
  res.send(listOfCollections)
}
const GetById = async (req, res) => {

}
const Post = async (req, res) => {

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