function POST(req, res,next) {
    console.log("WebHook POST CALLED");
    next();
}

function PUT(req, res,next) {
    console.log("WebHook PUT CALLED");
    next();
}


function DELETE(req, res,next) {
    console.log("WebHook DELETE CALLED");
    next();
}


module.exports =  {
    POST, 
    PUT, 
    DELETE
}