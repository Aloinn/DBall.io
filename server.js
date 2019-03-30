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

// INIT VARIABLES
var cwidth = 800;
var cheight = 600;

// INIT LIST OF PLAYERS & BALLS
var players = {};
var balls = [];
var numBalls = 3;
var gameSpeed = 1000/60;
// SPAWN BALLS
for(var i = 0; i < numBalls; i++){
  balls[i] = new Object();
  balls[i].type = 'ball';
  balls[i].x = cwidth*(1+i)/(numBalls+1);
  balls[i].dx = 0;
  balls[i].y = cheight/2;
  balls[i].dy = 0;
  balls[i].color = "#00000";
  balls[i].owner = undefined;
  players['ball'+i.toString()] = balls[i];
}

// STEP BALLS
setInterval(function(){
  for(var i = 0; i < numBalls; i++){
    var ball = balls[i];
    if(ball.owner === undefined){
      ball.x += ball.dx;
      ball.y += ball.dy;
    } else {
      var player = ball.owner;
      ball.x = player.x+ player.angleN*(35*Math.cos(player.angle+(Math.PI/4)));
      ball.y = player.y+ player.angleN*(35*Math.sin(player.angle+(Math.PI/4)));
    }
  }
}, gameSpeed);

// STEP PLAYERS
setInterval(function(){
  // ITERATES ALL PLAYERS
  for(var id in players){
    var player = players[id];
    if(player.type === 'player' && player.ball === false){
      // IF ONE OF THE NUM OF BALLS TOUCHES PLAYER, PLAYER OWNS IT
      // ITERATES THROUGH BALLS
      for(var i = 0; i < numBalls; i++){
        var ball = balls[i];
        if(ball.owner === undefined) {
          if(Math.abs(ball.x - player.x)<30 && Math.abs(ball.y - player.y)<30){
            ball.owner = player;
            player.ball = true;
          }
        }
      }
    }
  }
}, gameSpeed);

io.on('connection',function(socket){
  // WHEN NEW PLAYER JOINS
  socket.on('new player',function(){
    // CREATE A NEW PLAYER WITH x AND y VARIABLES
    playerid = socket.id;
    players[playerid] = new Object();
    players[playerid].type = 'player';
    players[playerid].x = 300;
    players[playerid].y = 300;
    players[playerid].color = "#"+((1<<24)*Math.random()|0).toString(16);
    players[playerid].ball = false;
    players[playerid].angle = 0;
  })
  // WHEN PLAYER CLICKS
  socket.on('mouse',function(){

  })
  // WHEN PLAYER MOVES
  socket.on('input', function(data) {
    var player = players[socket.id] || {};
    // MOVEMENT
    var speed = data.speed;
    if((data.up||data.down)&&(data.left||data.right))
    {speed = Math.sqrt(2*speed^2)}

    if(data.up    && player.y - speed > 0)            {player.y-=speed}
    if(data.down  && player.y + speed < cheight) {player.y+=speed}
    if(data.left  && player.x - speed > 0)            {player.x-=speed}
    if(data.right && player.x + speed < cwidth)  {player.x+=speed}

    // DIRECTION FACING
    var distx = data.mouseX - player.x;
    var disty = data.mouseY - player.y;
    //var disty = player.y - data.mouseY;
    player.angle = Math.atan(disty/distx);
    player.angleN = Math.sign(data.mouseX - player.x);
  })
  // WHEN PLAYER DISCONNECTS
  socket.on('disconnect',function(){
    delete players[socket.id];
  })
});

// SENDS DRAW FLAG TO ALL CLIENTS
setInterval(function(){
  //var objects = balls.concat(players);
  io.sockets.emit('state',players);
},gameSpeed)
