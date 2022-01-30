const logger = require("./logger");
const Prime = require("./prime");
const Cache = require("./cache");

function PreLoad(app) {
  app.use([logger]);
}

function PostLoad(app) {}

module.exports = {
  PreLoad,
  GET: [Prime, Cache.CacheGet],
  GETBYID: [Prime, Cache.CacheGetById],
  POST: [Prime],
  PUT: [Prime],
  DELETE: [Prime],
  PostLoad,
};
