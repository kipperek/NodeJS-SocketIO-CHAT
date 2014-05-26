var express = require("express");
var connect = require('connect');
var redis = require('redis');
var passport = require('passport');
var socketio = require("socket.io");
var passportSocketIo = require('passport.socketio');
var LocalStrategy = require('passport-local').Strategy;
var routes = require('./routes');
var sessionStore = new connect.session.MemoryStore();

var sessionSecret = '123hbh321h3jHhjj123459900dsad09dad78s';
var sessionKey = 'connect.sid';

var rClient = redis.createClient();
var app = express();
var httpServer = require("http").createServer(app);
var io = socketio.listen(httpServer, { log: false });

//Konfiguracja chatu
var history = {"roomGlobal": []};
var rooms = [{id: "roomGlobal", name: "Pokój globalny"}];


// Konfiguracja passport.js
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new LocalStrategy(
    function (username, password, done) {
    	rClient.get(username, function (err, reply) {
    		if (reply && password === reply.toString()) {
            console.log("Udane logowanie...");
            return done(null, {
                username: username,
                password: password
            });
	        } else {
	            return done(null, false);
	        }
	    });

        
    }
));
//express + passport
app.use(express.cookieParser());
app.use(express.urlencoded());
app.use(express.session({
    store: sessionStore,
    key: sessionKey,
    secret: sessionSecret
}));
app.use(passport.initialize());
app.use(passport.session());

//Konfiguracja expressa
app.use(express.static("public"));
app.use(express.static("bower_components"));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//Routing
app.get('/register', routes.register);
app.get('/chat', routes.chat);
app.get('/login', routes.login);
app.get('/', routes.index);
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
});

app.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        res.redirect('/chat');
    }
);

app.post('/register',function(req, res){
	if(req.body.pass == req.body.pass2)
     rClient.set(req.body.username, req.body.pass, function(){
     	res.redirect('/login');
     });
 	else{
 		res.redirect('/register');
 	}
        
});

//SocketIO
var onAuthorizeSuccess = function (data, accept) {
    console.log('Udane połączenie z socket.io');
    accept(null, true);
};

var onAuthorizeFail = function (data, message, error, accept) {
    if (error) {
        throw new Error(message);
    }
    console.log('Nieudane połączenie z socket.io:', message);
    accept(null, false);
};

io.set('authorization', passportSocketIo.authorize({
    passport: passport,
    cookieParser: express.cookieParser,
    key: sessionKey, // nazwa ciasteczka, w którym express/connect przechowuje identyfikator sesji
    secret: sessionSecret,
    store: sessionStore,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
}));

io.set('log level', 2); // 3 == DEBUG, 2 == INFO, 1 == WARN, 0 == ERROR

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
//redis
//client.on('connect', function(){});