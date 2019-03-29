// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5002);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(5002, function() {
  console.log('Starting server on port 5002');
});

// INIT LIST OF PLAYERS
var players = {};

io.on('connection',function(socket){
  // WHEN NEW PLAYER JOINS
  socket.on('new player',function(){
    // CREATE A NEW PLAYER WITH x AND y VARIABLES
    playerid = socket.id;
    players[playerid] = new Object();
    players[playerid].x = 300;
    players[playerid].y = 300;
    players[playerid].color = "#"+((1<<24)*Math.random()|0).toString(16);
  })
  // WHEN PLAYER CLICKS
  socket.on('mouse',function(mouse){
    var player = players[socket.id] || {};
    player.x = mouse.x;
    player.y = mouse.y;
  })
  // WHEN PLAYER MOVES
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    var speed = data.speed;
    if((data.up||data.down)&&(data.left||data.right))
    {speed = Math.sqrt(2*speed^2)}

    if(data.up    && player.y - speed > 0)            {player.y-=speed}
    if(data.down  && player.y + speed < 600) {player.y+=speed}
    if(data.left  && player.x - speed > 0)            {player.x-=speed}
    if(data.right && player.x + speed < 800)  {player.x+=speed}
  })
  // WHEN PLAYER DISCONNECTS
  socket.on('disconnect',function(){
    delete players[socket.id];
  })
});

setInterval(function(){
  io.sockets.emit('state',players);
},1000/60)

/*
io.on('connection', function(socket){
  // NEW PLAYER JOINS
  io.on('newplayer',function(){
    io.sockets.emit('message','hi');
    players[socket.id] = {
      x: 300,
      y: 300
    };
    /*
    var idp = socket.id;
    players[idp] = new Object();
    players[idp].x = 300;
    players[idp].y = 300;
  });

  // PLAYER MOVEMENT CHECKS
  io.on('movement',function(data){
    // (data refers to the movement function of client)
    var player = players[socket.id] || {};
    if(data.left) {player.x -=5;}
    if(data.right){player.x +=5;}
    if(data.up) {player.y -=5;}
    if(data.down){player.y +=5;}
  });
});

// SEND THE FLAG FOR THE PLAYER TO DRAW THE GAME
function playerdraw(){
  // SENDS LIST OF PLAYERS TO ALL PLAYERS
  io.sockets.emit('state', players);
} setInterval(playerdraw,1000/60);*/
