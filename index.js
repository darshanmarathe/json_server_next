"use strict";

const fs = require("fs");
const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
app.use(cors());
app.use(
  bodyParser.json({
    strict: true,
  })
);

app.get("/:type/", async (req, res) => {
  let item = await readFolderContent(req.params);
  res.send(item);
});

app.get("/:type/:id", async (req, res) => {
  let item = await readfileContent(req.params);
  res.send(item);
});

app.post("/:type/", async (req, res) => {
  let { type } = req.params;
  let item = req.body;
  const has_id = "id" in item;
  let id = has_id ? item.id : UUID();
  try {
    await createFile(type, req.body, id);
    item.id = id;
    res.send(item);
  } catch (error) {
    res.send(error);
  }
});

app.put("/:type/:id", async (req, res) => {
  let { type, id } = req.params;
  let item = req.body;
  try {
    let obj = await updateFile(type, req.body, id);
    res.send(obj);
  } catch (error) {
    res.send(error);
  }
});

app.delete("/:type/:id", async (req, res) => {
  let { type, id } = req.params;
  deleteFile(type, id);
  res.send("Deleted.");
});

function createFile(type, body, id) {
  body.id = id;
  return new Promise((res, rej) => {
    if (fs.existsSync(`./data/${type}/${id}.json`)) {
      rej(new Error("record already exist."));
    }
    fs.writeFileSync(`./data/${type}/${id}.json`, JSON.stringify(body));
    res(body);
  });
}

function updateFile(type, body, id) {
  return new Promise(async (res, rej) => {
    if (fs.existsSync(`./data/${type}/${id}.json`)) {
      const file = await readfileContent({ type, id });
      let obj = Object.assign({}, file, body);
      console.log(obj);
      fs.writeFileSync(`./data/${type}/${id}.json`, JSON.stringify(obj));

      res(obj);
    }
    rej(new Error("record dose not exist."));
  });
}

function deleteFile(type, id) {
  fs.unlinkSync(`./data/${type}/${id}.json`);
}
function readFolderContent({ type }) {
  let result = [];
  return new Promise((res, rej) => {
    let files = fs.readdirSync(`./data/${type}/`);
    console.log(files);
    for (const file of files) {
      let data = fs.readFileSync(`./data/${type}/${file}`);
      let record_data = JSON.parse(data);
      console.log(record_data);
      result.push(record_data);
    }
    res(result);
  });
}

function readfileContent({ type, id }) {
  return new Promise((res, rej) => {
    fs.readFile(`./data/${type}/${id}.json`, (err, data) => {
      if (err) rej(err);
      let record_data = JSON.parse(data);
      res(record_data);
    });
  });
}

function UUID() {
  var dt = new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    }
  );
  return uuid;
}
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
