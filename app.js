var express = require("express");
var app = express();

var httpServer = require("http").createServer(app);

var socketio = require("socket.io");
var io = socketio.listen(httpServer, { log: false });

var history = {"roomGlobal": []};
var rooms = [{id: "roomGlobal", name: "Pokój globalny"}];


app.use(express.static("public"));
app.use(express.static("bower_components"));

io.sockets.on('connection', function (socket) {
	socket.join('roomGlobal');
	socket.emit('history', history.roomGlobal);
	socket.emit('rooms', rooms);
	socket.set('room','roomGlobal');

	socket.on('send msg', function (data) {
		socket.get('room', function (err, room) {
      		history[room].push(data);
			io.sockets.in(room).emit('rec msg', data);
   		 });
		
	});

	socket.on('changeRoom', function (data) {
		socket.get('room', function (err, room) {
			socket.leave(room);
		});
		socket.join(data);
		socket.set('room',data);
		socket.emit('history', history[data]);
	});
	socket.on('createRoom', function (data) {
		var newRoom = {id: "room"+rooms.length, name: data};
		history[newRoom.id] = [];
		rooms.push(newRoom);
		io.sockets.emit('rooms', rooms);		
	});


	
});

httpServer.listen(3000, function () {
    console.log('Serwer HTTP działa na pocie 3000');
});
