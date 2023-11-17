
const InitSoket = function (io, app) {
    Socket = io;
    app.set('socketio', io);


};


module.exports ={
    InitSoket
}