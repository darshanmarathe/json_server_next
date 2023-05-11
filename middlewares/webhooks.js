const axios  = require('axios');

function GetData(req){
    let type= req.params.type;
    if(type === undefined) return null;
    console.log("type",type , req[type + "_data"])
    return req[type + "_data"]
}

const validUrl = (URL) => (URL && URL.trim() !== '' && URL.startsWith('http'))

const fixURL = (URL , id) => URL.indexOf(':id') > -1 ? URL.replace(/:id/g, id) : URL+ "/" + id;

async function POST(req, res,next) {
    const data = GetData(req);
    if(data == null) next();
    console.dir(data)
    let {POST}  = data.webhooks
    console.log("WebHook POST CALLED" , POST);
    if(validUrl(POST)) {
        console.log("POST" ,POST , res.Body)
        axios.post(POST, res.Body).catch(function (error) {console.log(error);});
    }
    next();
}

async function PUT(req, res,next) {
    console.log("WebHook POST CALLED");
    const data = GetData(req);
    if(data == null) next();
    const id = req.params.id;
    let {PUT}  = data.webhooks
    PUT = fixURL(PUT, id);
    if(validUrl(PUT)) {
        console.log("PUT" ,PUT, res.Body)
        axios.put(PUT, res.Body).catch(function (error) {console.log(error);});
    }
    next();
}


async function DELETE(req, res,next) {
    console.log("WebHook POST CALLED");
    const data = GetData(req);
    if(data == null) next();
    const id = req.params.id;
    let {DELETE}  = data.webhooks
    DELETE = fixURL(DELETE, id);
    if(validUrl(DELETE)) {
        console.log("DELETE" ,DELETE, res.Body)
        axios.delete(DELETE).catch(function (error) {console.log(error);});
    }
    next();
}


module.exports =  {
    POST,
    PUT,
    DELETE
}
