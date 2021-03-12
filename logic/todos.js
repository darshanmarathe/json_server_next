const validPost =async  (obj) => {
    let errors = [];
    if(!obj.title) errors.push("title is required");
    return (errors.length === 0) ? true : errors;
}

const validPut =async  (obj) => {
    
}

const  validDelete =async (obj) => {
    
}

const WebHooks = {
    POST : "http://localhost:4000/post",
    PUT: "http://localhost:4000/post",
    DELTE : "http://localhost:4000/post"
}

module.exports = {
    validPut,
    validDelete,
    validPost,
    WebHooks
}