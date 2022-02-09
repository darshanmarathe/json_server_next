const axios = require('axios');



const validUrl = (URL) => (URL && URL.trim() !== '' && URL.startsWith('http'))

const fixURL = (URL, id) => URL.indexOf(':id') > -1 ? URL.replace(/:id/g, id) : URL + "/" + id;



function GetData(req) {
    let type = req.params.type;
    if (type === undefined) return null;
    console.log("type", type, req[type + "_data"])
    return req[type + "_data"]
}



const GET = async (req, res, next) => {
    const data = GetData(req);
    const {
        'rev-proxy': RevProxy
    } = data
    console.log(RevProxy);
    if (RevProxy !== true) {

        next();
    }
    const {
        GET
    } = data.proxies;
    if (validUrl(GET)) {
        const resonse = await axios.get(GET);
        res.send(resonse.data);
    }
}

const GETBYID = async (req, res, next) => {
    const data = GetData(req);
    const {
        'rev-proxy': RevProxy
    } = data
    console.log(RevProxy);
    if (RevProxy !== true) {

        next();
    }

    const {
        GETBYID
    } = data.proxies;
    console.log(GETBYID, "GETBYID PROXY")
    if (validUrl(GETBYID)) {
        let response = await axios.get(fixURL(GETBYID, req.params.id));
        res.send(response.data);
    }
}
const POST = async (req, res, next) => {
    const data = GetData(req);
    const {
        'rev-proxy': RevProxy
    } = data
    console.log(RevProxy);
    if (RevProxy !== true) {
        next();
    }

    const {
        POST
    } = data.proxies;
    console.log(POST, "POST PROXY")
    if (validUrl(POST)) {
        const response = await axios.post(POST, req.Body);
        console.log(response.data)
        res.send(response.data)
    }
}
const PUT = async (req, res, next) => {
    const data = GetData(req);
    const {
        'rev-proxy': RevProxy
    } = data
    console.log(RevProxy);
    if (RevProxy !== true) {

        next();
    }

    let {
        PUT
    } = data.proxies;
    console.log(PUT, "PUT PROXY")
    if (validUrl(PUT)) {
        PUT = fixURL(PUT, req.params.id);
        const response = await axios.put(PUT, req.Body);
        console.log(response.data)
        res.send(response.data)
    }
}
const DELETE = async (req, res, next) => {
    const data = GetData(req);
    const {
        'rev-proxy': RevProxy
    } = data
    console.log(RevProxy);
    if (RevProxy !== true) {

        next();
    }

    let {
        DELETE
    } = data.proxies;
    DELETE = fixURL(DELETE, req.params.id);
    if (validUrl(DELETE)) {
        res.send(await axios.delete(DELETE).data)
    }
}


module.exports = {
    GET,
    GETBYID,
    POST,
    PUT,
    DELETE
}