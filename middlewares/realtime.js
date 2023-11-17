function GetData(req) {
  let type = req.params.type;
  if (type === undefined) return null;
  console.log("type", type, req[type + "_data"]);
  return [req[type + "_data"], type];
}

const POST = function (req, res, next) {
  const io = req.app.get("socketio");
  const [data, type] = GetData(req);
  const { realtime } = data;

  if (data == null && realtime != false) next();
  io.to(type).emit("INSERT", ...req.body);
  next();
};

const PUT = function (req, res, next) {
  const io = req.app.get("socketio");
  const [data, type] = GetData(req);
  const { realtime } = data;

  if (data == null && realtime != false) next();
  io.to(type).emit("PUT", ...req.body);
  next();
};

const DELETE = function (req, res, next) {
  const io = req.app.get("socketio");
  const [data, type] = GetData(req);
  const { realtime } = data;

  if (data == null && realtime != false) next();
  io.to(type).emit("DELETE", ...req.body);
  next();
  
};

module.exports = {
  POST,
  PUT,
  DELETE,
};
