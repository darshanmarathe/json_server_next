"use strict";
const log = console.log;
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
console.clear();

var methodOverride = require('method-override');
var provider = process.env.PROVIDER || 'filesys';

const repo = function () {
  const reposAvaible = ['nedb', 'filesys', 'mongo', 'redis']
  if (reposAvaible.indexOf(provider) === -1) provider = 'filesys';
  log(provider)
  return require(`./repos/${provider}`);
}();

const ctrl = function () {
  const exist = fs.existsSync(`./Controllers/${provider}Ctrl.js`);
  log(exist, "exist")
  if (!exist) return require(`./Controllers/mainCtrl.js`);
  return require(`./Controllers/${provider}Ctrl.js`);
}();

if (!repo.Init()) {
  log('repo init failed')
  process.exit(1)
}

log(ctrl)

ctrl.Init(repo);

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

app.get("/", ctrl.Index);
app.get("/:type/", ctrl.Get);
app.get("/:type/:id", ctrl.GetById);
app.post("/:type/", ctrl.Post);
app.put("/:type/:id", ctrl.Put);
app.delete("/:type/:id", ctrl.Delete);


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});