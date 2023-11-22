"use strict";
const log = console.log;
const fs = require("fs");
const express = require("express");

const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const middlewares = require('./middlewares/index');

console.clear();

const server = require('http').createServer(app);

var io = require('socket.io')(server);

var methodOverride = require('method-override');
var provider = (process.env.PROVIDER || 'filesys').toLowerCase();
log(`Provider selected: ${provider}`)

const _cache = require('./common/Cache.js');
const AdminCtrol = require('./Controllers/Admin/Crud');

_cache.Init();

const repo = function () {
  const reposAvaible = ['nedb', 'filesys', 'mongo', 'redis', 'postgres', 'sql'];
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


ctrl.Init(repo, _cache);
AdminCtrol.Init(repo);


function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    console.log(err)
    return next(err)
  }
  res.sendStatus(500)
}

const port = process.env.PORT || 4000;
app.use(cors());
app.use(
  bodyParser.json({
    strict: false,
  })
);

app.use(methodOverride())
app.use(errorHandler)



middlewares.PreLoad(app)
log(AdminCtrol)



//Admin UI
app.get("/admin/", AdminCtrol.Index);
app.get("/realtime/" , ctrl.Realtime)

//Admin Ctrl
app.get("/admin/collections/",  AdminCtrol.Get);
app.get("/admin/collections/:id", AdminCtrol.GetById);
app.post("/admin/collections/", AdminCtrol.Post);
app.put("/admin/collections/:id", AdminCtrol.Put);


//Admin Auth



//Main Ctrl
app.get("/rest/", ctrl.Index);
app.get("/rest/:type/", ...middlewares.GET , ctrl.Get, ...middlewares.GETEND);
app.get("/rest/:type/:id", ...middlewares.GETBYID , ctrl.GetById, ...middlewares.GETBYIDEND);
app.post("/rest/:type/",...middlewares.POST , ctrl.Post, ...middlewares.POSTEND);
app.put("/rest/:type/:id",...middlewares.PUT, ctrl.Put , ...middlewares.PUTEND) ;
app.delete("/rest/:type/:id",...middlewares.DELETE ,ctrl.Delete ,  ...middlewares.DELETEEND);


middlewares.PostLoad(app)


app.set('socketio', io);
io.on('connection', (socket) => { 
    console.log('connected....', socket)
})


server.listen(port, () => {
  log(`Example app listening at http://localhost:${port}`);
});

