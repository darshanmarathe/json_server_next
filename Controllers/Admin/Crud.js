var repo = null

const Init = async (_repo) => {
  repo = _repo;
}
const Index = async (req, res) => {

}
const Get = async (req, res) => {
  let listOfCollections = await repo.CollectionList();
  listOfCollections = listOfCollections.filter((x) => x.toLowerCase() !== "admin")

  let html = `
    <h1> Routes already available</h1>
    <hr>
    <ul>
      ${listOfCollections.map(x => `<li><a href="/${x}">/${x}</a></li>`).join('')}
    </ul>
      `

  console.log(html)
  res.send(html)
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