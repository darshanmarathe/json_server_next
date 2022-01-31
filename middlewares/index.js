const logger = require("./logger");
const Prime = require("./prime");
const Cache = require("./cache");
const WebHooks = require("./webhooks")
function PreLoad(app) {
  app.use([logger]);
}

function PostLoad(app) {}

module.exports = {
  PreLoad,
  GET: [Prime, Cache.CacheGet],
  GETEND : [],
  GETBYID: [Prime, Cache.CacheGetById],
  GETBYIDEND: [], 
  POST: [Prime ],
  POSTEND: [ WebHooks.POST],
  PUT: [Prime],
  PUTEND: [ WebHooks.PUT],
  DELETE: [Prime],
  DELETEEND: [ WebHooks.DELETE],
  PostLoad,
};
