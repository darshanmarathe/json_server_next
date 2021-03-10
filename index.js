"use strict";

const fs = require("fs");
const express = require("express");
var cors = require("cors");
const app = express();
const port = 3000;
app.use(cors());

app.get("/:type/", async (req, res) => {
  let item = await readFolderContent(req.params);
  res.send(item);
});

app.get("/:type/:id", async (req, res) => {
  let item = await readfileContent(req.params);
  res.send(item);
});

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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
