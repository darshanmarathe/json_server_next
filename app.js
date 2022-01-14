"use strict";
const log = console.log;
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
console.clear();

var methodOverride = require('method-override');
var provider = (process.env.PROVIDER || 'filesys').toLowerCase();
log(`Provider selected: ${provider}`)

const AdminCtrol = require('./Controllers/Admin/Crud');


const repo = function () {
  const reposAvaible = ['nedb', 'filesys', 'mongo', 'redis' ,'postgres' , 'sql'];
  if (reposAvaible.indexOf(provider) === -1) provider = 'filesys';
  return require(`./repos/${provider}`);
}();

const ctrl = function () {
  const exist = fs.existsSync(`./Controllers/${provider}Ctrl.js`);
  if (!exist) return require(`./Controllers/mainCtrl.js`);
  return require(`./Controllers/${provider}Ctrl.js`);
}();

if (!repo.Init()) {
  log('repo init failed')
  process.exit(1)
}


ctrl.Init(repo);
AdminCtrol.Init(repo);


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



//Admin Ctrl
app.get("/admin/", AdminCtrol.Index);
app.get("/admin/:collection/", AdminCtrol.Get);
app.get("/admin/:collection/:id", AdminCtrol.GetById);
app.post("/admin/:collection/", AdminCtrol.Post);
app.put("/admin/:collection/:id", AdminCtrol.Put);



//Main Ctrl
app.get("/", ctrl.Index);
app.get("/:type/", ctrl.Get);
app.get("/:type/:id", ctrl.GetById);
app.post("/:type/", ctrl.Post);
app.put("/:type/:id", ctrl.Put);
app.delete("/:type/:id", ctrl.Delete);



//Admin UI



//Admin Auth


app.listen(port, () => {
  log(`Example app listening at http://localhost:${port}`);
});
