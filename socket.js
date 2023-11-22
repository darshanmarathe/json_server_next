
const InitSoket = function (io, app) {
    
    app.set('socketio', io);
    io.on('connection', (socket) => { 
        console.log('connected....')
    })

};


module.exports ={
    InitSoket
}