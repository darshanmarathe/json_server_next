const logger = require("./logger");
const Prime = require("./prime");
const Cache = require("./cache");
const revProxy = require("./rev-proxy");
const WebHooks = require("./webhooks");
const realtime = require('./realtime');
function PreLoad(app) {
  console.clear();
  app.use([logger]);
}

function PostLoad(app) { }

module.exports = {
  PreLoad,
  GET: [Prime, revProxy.GET, Cache.CacheGet],
  GETEND: [],
  GETBYID: [Prime, revProxy.GETBYID, Cache.CacheGetById],
  GETBYIDEND: [],
  POST: [Prime, revProxy.POST,],
  POSTEND: [WebHooks.POST , realtime.POST],
  PUT: [Prime, revProxy.PUT,],
  PUTEND: [WebHooks.PUT , realtime.PUT],
  DELETE: [Prime, revProxy.DELETE,],
  DELETEEND: [WebHooks.DELETE , realtime.DELETE],
  PostLoad,
};
