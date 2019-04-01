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
var numBalls = 5;
var gameSpeed = 1000/60;
// SPAWN BALLS
for(var i = 0; i < numBalls; i++){
  balls[i] = new Object();
  balls[i].type = 'ball';
  balls[i].x = cwidth/2;
  balls[i].dx = 0;
  balls[i].y = cheight*(1+i)/(numBalls+1);
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
      // CHECK FOR BALL BOUNCE ON X
      if(ball.x + ball.dx < 0 || ball.x + ball.dx > cwidth){
        ball.dx = -ball.dx;
        ball.dy*= 0.5;
        ball.dx *= 0.5;
      } else {// OTHERWISE FOLLOW SPEED
        ball.x += ball.dx;
        ball.dx *= 0.99
      }

      // CHECK FOR BALL BOUNCE ON Y
      if(ball.y + ball.dy < 0 || ball.y + ball.dy > cheight){
        ball.dy = -ball.dy;
        ball.dy*= 0.5;
        ball.dx *=0.5;
      } else { // OTHERWISE FOLLOW SPEED
        ball.y += ball.dy;
        ball.dy *= 0.99
      }

      // DAMPEN SPEED IF TOTAL SPEED IS LESS THAN 2
      var spd = Math.sqrt(Math.pow(ball.dy,2)+Math.pow(ball.dx,2));
      if(spd < 0.2){
        ball.dy = 0;
        ball.dx = 0;
      }
    } else {
      var player = ball.owner;
      // SET POSITION FOR THE BALL RELATIVE TO DIRECTION PLAYER FACSE
      ball.x = player.x+ player.angleN*(35*Math.cos(player.angle+(Math.PI/4)+((player.charge-1)*Math.PI/2)));
      ball.y = player.y+ player.angleN*(35*Math.sin(player.angle+(Math.PI/4)+((player.charge-1)*Math.PI/2)));
      // IF PLAYER JUST THREW THIS BALL
      if(player.ball === false){
        ball.x = player.x+ player.angleN*(50*Math.cos(player.angle));
        ball.y = player.y+ player.angleN*(50*Math.sin(player.angle));
        ball.dx = 10*player.angleN*(player.charge)*player.charge*Math.cos(player.angle);
        ball.dy = 10*player.angleN*(player.charge)*player.charge*Math.sin(player.angle);
        ball.owner = undefined;
        player.charge = 1;
      }
    }
  }
}, gameSpeed);

// STEP PLAYERS
setInterval(function(){
  // ITERATES ALL PLAYERS
  for(var id in players){
    var player = players[id];
    // CHARGE UP THROW
    if(player.charging === true){
      if(player.charge < 2){
        player.charge+= 0.005;
        player.speed = player.speedmax/(player.charge*player.charge);
      }
    } else {
    // IF NOT CHARGING UP THROW
    player.speed = player.speedmax;
    }
    // CHECK BALL PICKUP
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
  socket.on('new player',function(name){
    // CREATE A NEW PLAYER WITH x AND y VARIABLES
    playerid = socket.id;
    players[playerid] = new Object();
    players[playerid].name = name;
    players[playerid].type = 'player';
    players[playerid].x = 300;
    players[playerid].y = 300;
    players[playerid].color = "#"+((1<<24)*Math.random()|0).toString(16);
    players[playerid].ball = false;
    players[playerid].angle = 0;
    players[playerid].charge = 1;
    players[playerid].charging = false;
    players[playerid].speed = 5;
    players[playerid].speedmax = 5;
  })
  // WHEN PLAYER CLICKS
  socket.on('mouse',function(click){
    var player = players[socket.id] || {};
    switch(click){
      case 0:
        player.charging = true;
        player.ball = false;
        player.charging = false;
        break;
      case 1:
        if(player.ball === true){
          player.charging = true;
        }
        break;
      case 2:
        player.ball = false;
        player.charging = false;
        break;
    }
  })
  // WHEN PLAYER MOVES
  socket.on('input', function(data) {
    var player = players[socket.id] || {};
    // MOVEMENT
    var speed = player.speed;
    if((data.up||data.down)&&(data.left||data.right))
    {speed = Math.max(Math.sqrt(2*((1.5*speed)^2)),1)}

    if(data.up    && player.y - speed > 0)            {player.y-=speed}
    if(data.down  && player.y + speed < cheight)      {player.y+=speed}
    if(data.left  && player.x - speed > 0)            {player.x-=speed}
    if(data.right && player.x + speed < cwidth)       {player.x+=speed}

    // DIRECTION FACING
    var distx = data.mouseX - player.x;
    var disty = data.mouseY - player.y;
    //var disty = player.y - data.mouseY;
    player.angle = Math.atan(disty/distx);
    player.angleN = Math.sign(data.mouseX - player.x);
  })
  // WHEN PLAYER DISCONNECTS
  socket.on('disconnect',function(){
    var player = players[socket.id] || {};
    player.charge = 0;
    player.ball = false;
    delete players[socket.id];
  })
});

// SENDS DRAW FLAG TO ALL CLIENTS
setInterval(function(){
  //var objects = balls.concat(players);
  io.sockets.emit('state',players);
},gameSpeed)
