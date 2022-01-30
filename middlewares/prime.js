const repo = function () {
    let provider = 'filesys';
    const reposAvaible = ['nedb', 'filesys', 'mongo', 'redis', 'postgres', 'sql'];
    if (reposAvaible.indexOf(provider) === -1) provider = 'filesys';
    return require(`../repos/${provider}`);
  }();
  

function Prime(req, res, next) {
    let type= req.params.type;
     if(type === undefined) next();
     repo.CollectionGet(type).then(data => {
        req[type + "_data"] = data;
        next();
    });    

}

module.exports = Prime
