"use strict";
const log = console.log;
const fs = require("fs");
const express = require("express");
const { traceAny } = require("./common/functionTrace");

const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const middlewares = traceAny(require("./middlewares/index"), "middlewares");

console.clear();

const server = require('http').createServer(app);

var io = require('socket.io')(server);

var methodOverride = require('method-override');
var provider = (process.env.PROVIDER || 'filesys').toLowerCase();
log(`Provider selected: ${provider}`)

const _cache = traceAny(require("./common/Cache.js"), "cache");
const AdminCtrol = traceAny(require("./Controllers/Admin/Crud"), "adminCtrl");

_cache.Init();

const repo = traceAny(function () {
  const reposAvaible = ['nedb', 'filesys', 'mongo', 'redis', 'postgres', 'sql', 'sqlite'];
  if (reposAvaible.indexOf(provider) === -1) provider = 'filesys';
  return require(`./repos/${provider}`);
}(), `repo:${provider}`);

const ctrl = traceAny(function () {
  const exist = fs.existsSync(`./Controllers/${provider}Ctrl.js`);
  if (!exist) return require(`./Controllers/mainCtrl.js`);
  return require(`./Controllers/${provider}Ctrl.js`);
}(), `ctrl:${provider}`);

process.on("uncaughtException", (error) => {
  console.error("[TRACE][FATAL] uncaughtException");
  console.error(error && error.stack ? error.stack : error);
  console.error("[TRACE][FATAL][CALLSTACK]");
  console.error(new Error().stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("[TRACE][FATAL] unhandledRejection");
  console.error(reason && reason.stack ? reason.stack : reason);
  console.error("[TRACE][FATAL][CALLSTACK]");
  console.error(new Error().stack);
});

if (!repo.Init()) {
  log('repo init failed')
  process.exit(1)
}


ctrl.Init(repo, _cache);
AdminCtrol.Init(repo);


function errorHandler(err, req, res, next) {
  console.error("[TRACE][EXPRESS][ERROR]");
  console.error(err && err.stack ? err.stack : err);
  console.error("[TRACE][EXPRESS][CALLSTACK]");
  console.error(new Error().stack);
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
app.patch("/rest/:type/:id",...middlewares.PATCH, ctrl.Patch , ...middlewares.PATCHEND) ;
app.delete("/rest/:type/:id",...middlewares.DELETE ,ctrl.Delete ,  ...middlewares.DELETEEND);


middlewares.PostLoad(app)


app.set('socketio', io);
io.on('connection', (socket) => { 
    console.log('connected....', socket.id)
})


server.listen(port, () => {
  log(`Example app listening at http://localhost:${port}`);
});

