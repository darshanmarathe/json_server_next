"use strict";
const log = console.log;
const fs = require("fs");
const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");
console.clear();

var methodOverride = require('method-override');

const repo = function() {
  const reposAvaible = ['nedb' , 'filesys']
  let provider = process.env.PROVIDER || 'filesys';
  if(reposAvaible.indexOf(provider) === -1) provider = 'filesys';
  log(provider)  
  return require(`./repos/${provider}`);
}(); 

if(!repo.init()){
  log('repo init failed')
  process.exit(1)
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }
  res.sendStatus(500)
}

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(
  bodyParser.json({
    strict: false,
  })
);

app.use(methodOverride())
app.use(errorHandler)

app.get("/" , async (req, res) => {
 const listOfCollections = await repo.CollectionList();
  let html =`
  <h1> Routes already available</h1>
  <hr>
  <ul>
    ${listOfCollections.map(x => `<li><a href="/${x}">/${x}</a></li>`).join('')}
  </ul>
    ` 
  res.send(html)
});

app.get("/:type/", async (req, res) => {
  let items = await repo.GetData(req.params);
  items = repo.GetPaginatedItems(items, req.query)
  res.send(items);
});


app.get("/:type/:id", async (req, res) => {
  let item = await repo.GetDataById(req.params);
  if (typeof item === 'object')
    res.send(item);
  else
    res.sendStatus(item);
});

app.post("/:type/", async (req, res) => {
  let { type } = req.params;
  try {
   const item =   await repo.Create(type, req.body);
    res.send(item);
  } catch (error) {
    res.send(error);
  }
});

// app.put("/:type/:id", async (req, res) => {
//   let { type, id } = req.params;
//   if (req.body.id) delete req.body.id;
//   console.log(req.body)
//   try {
//     let obj = await updateFile(type, req.body, id);
//     res.send(obj);
//   } catch (error) {
//     res.send(error);
//   }
// });

// app.delete("/:type/:id", async (req, res) => {
//   let { type, id } = req.params;
//   deleteFile(type, id);
//   res.send("Deleted.");
// });


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
