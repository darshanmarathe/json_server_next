const logger = require("./logger");
const Prime = require("./prime");
const Cache = require("./cache");
const revProxy = require("./rev-proxy");
const WebHooks = require("./webhooks")
function PreLoad(app) {
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
  POSTEND: [WebHooks.POST],
  PUT: [Prime, revProxy.PUT,],
  PUTEND: [WebHooks.PUT],
  DELETE: [Prime, revProxy.DELETE,],
  DELETEEND: [WebHooks.DELETE],
  PostLoad,
};
