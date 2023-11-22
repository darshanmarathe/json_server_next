const GET = function (type, items) {
  items.forEach((n) => {
    GETBYID(type, n);
  });
console.log(items , "Items")
  return items;
};

const GETBYID = function (type, item) {
  const links = [
    { rel: "self", href: `/rest/${type}/${item._id}`, method: "GET" },
    { rel: "update", href: `/rest/${type}/${item._id}`, method: "PUT" },
    { rel: "delete", href: `/rest/${type}/${item._id}`, method: "DELETE" },
    { rel: type, href: `/rest/${type}`, method: "GET" },
  ];

  item.links = links;

  return item;
};

module.exports = {
  GET,
  GETBYID,
};
