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

var states = {
  "waiting":0,
  "playing":1,
  "scoreboard":2,
}
Object.freeze(states);

var rooms = {};

// MAKES RANDOM ID
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 4; i++)
  {text += possible.charAt(Math.floor(Math.random() * possible.length))};
  return text;
}

// ITERATES THROUGH ALL ROOMS
/*
for(var rmnm in rooms){
  var room = rooms[rmnm];
  if(room.state = states.waiting){

  }
}*/
// CREATE TEAMS FUNCTION
function makeTeams(room){
  // CLEARS TEAMS
  room.blue.length = 0;
  room.red.length = 0;

  for(var i = 0; i < room.players.length; i ++){
    // ITERATES ALL PLAYER OBJECTS IN ROOM USING
    // ID FROM ROOM'S PLAYER ARRAY
    var player = players[room.players[i]];

    // IF PLAYER HAS UNDECLARED TEAM
    if(player.team === "undeclared"){
      // CHECKS WHICH TEAM IS BIGGER
      if(room.blue.length <= room.red.length){
        player.team = 'blue';
      } else {
        player.team = 'red';
      }
    }
    // SORTS PLAYER TEAMS
    if(player.team === 'blue'){// IF BLUE
      room.blue.push({name:player.name, ready:player.ready, })
    } else {
      room.red.push({name:player.name, ready:player.ready, })
    }
  }
}

io.on('connection',function(socket){

  // NEW CONNECTION
  socket.on('new connection',function(name){
    playerid = socket.id;
    players[playerid] = new Object();
    players[playerid].name = name;
    players[playerid].rm = 0;
    players[playerid].ready = false;
    players[playerid].team = "undeclared";
  });

  // PLAYER CREATES A ROOM
  socket.on('create',function(){
    // MAKE NEW ROOM ID
    var rmnm = makeid();
      // KEEP GENERATING CODE UNTIL ITS COMPLETELY UNIQUE
    while(typeof rooms[rmnm] != "undefined")
    {rmnm = makeid();}
      // ADD ROOM ID TO ROOM LIST
    var player = players[socket.id]
    rooms[rmnm] = new Object();
    rooms[rmnm].rmnm = rmnm;
    rooms[rmnm].state = states.waiting;

    rooms[rmnm].players = [];
    rooms[rmnm].players.push(socket.id);

    rooms[rmnm].blue = [];
    rooms[rmnm].red = [];

    makeTeams(rooms[rmnm]);

    player.rm = rmnm;
    socket.join(rmnm);

    io.sockets.in(rmnm).emit('renderRoom',rooms[rmnm]);
  });

  // PLAYER JOINS ROOM
  socket.on('join',function(rmnm){
    // CHECKS IF ROOM EXISTS
    if(rooms[rmnm] && rooms[rmnm].players.length !=10){
      // IF SUCCESSFULLY JOINED ROOM
      var player = players[socket.id];

      player.rm = rmnm;
      rooms[rmnm].players.push(socket.id);
      makeTeams(rooms[rmnm])
      socket.join(rmnm);
      io.sockets.in(rmnm).emit('renderRoom',rooms[rmnm]);

    } else {
      // IF CANNOT JOIN ROOM
      if(!rooms[rmnm])
      {io.to(`${socket.id}`).emit('no room', "Room does not exist!");}
      else
      {io.to(`${socket.id}`).emit('no room', "Room is full!");}
    }
  })

  // WHEN PLAYER IS READY IN LOBBY
  socket.on('player ready',function(){
    player = players[socket.id]
    player.ready ? player.ready = false : player.ready = true;
    makeTeams(rooms[player.rm]);
    io.sockets.in(player.rm).emit('renderRoom',rooms[player.rm]);
  });

  // WHEN PLAYER SWITCH TEAMS
  socket.on('switch teams',function(){
    player = players[socket.id]
    player.team === 'red' ? player.team = 'blue' : player.team = 'red';
    player.ready = false;
    makeTeams(rooms[player.rm]);
    io.sockets.in(player.rm).emit('renderRoom',rooms[player.rm]);
  })

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
    {speed = Math.max(Math.sqrt(2*((1.5*speed)^2)),0.5)}

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
  // WHEN PLAYER LEAVES ROOM
  socket.on('leave room',function(){
    var player = players[socket.id] || {};

    if(player.rm && rooms[player.rm] &&
        rooms[player.rm].players && rooms[player.rm].players == 1)
    {delete rooms[player.rm];}
    else if(player.rm && rooms[player.rm]){
      disconnectLobby(player.rm, socket)
    }
  });
  // WHEN PLAYER DISCONNECTS SUDDENLY
  socket.on('disconnect',function(){
    var player = players[socket.id] || {};
    // IF PLAYER HAS VARIABLES THEN DELETE THEM
    if(typeof player.charge != undefined){
      player.charge = 0;
      player.ball = false;
    }

    // If player is last player in room, delete room
    if(player.rm && rooms[player.rm] &&
        rooms[player.rm].players && rooms[player.rm].players == 1)
    {delete rooms[player.rm];}
    // ELSE IF NOT LAST PERSON IN ROOM
    else if(player.rm && rooms[player.rm]){
      disconnectLobby(player.rm, socket)
    }

    // Delete player
    delete players[socket.id];
  })
});

// FUNCTION TO DISCONNECT PLAYER FROM ROOM
function disconnectLobby(rmnm,socket){
  // ITERATES THROUGH ALL PLAYERS IN ROOM
  io.emit('message',rooms[rmnm]);
  for(var i = 0; i < rooms[rmnm].players.length; i ++){

    rooms[rmnm].players = rooms[rmnm].players.filter(player => player != socket.id)
    io.emit('message',socket.id);
    io.emit('message',rooms[rmnm]);
  }
  // RERENDERS FOR ALL PLAYERS
  socket.leave(rmnm);
  makeTeams(rooms[rmnm]);
  io.sockets.in(rmnm).emit('renderRoom',rooms[rmnm]);
}

// SENDS DRAW FLAG TO ALL CLIENTS
setInterval(function(){
  //var objects = balls.concat(players);
  io.sockets.emit('state',players);
  //io.sockets.emit('message',rooms)
},gameSpeed)

                    //////////////////
                    /// GAME LOGIC ///
                    //////////////////

// INIT LIST OF PLAYERS & BALLS
var players = {};
var balls = [];

spawnBalls(5);
var gameSpeed = 1000/60;
// SPAWN BALLS
function spawnBalls(numBalls){
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
}

// STEP BALLS
var stepBalls = setInterval(function(){
  for(var i = 0; i < balls.length; i++){
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
      //ball.x = player.x+ player.angleN*(35*Math.cos(player.angle+(Math.PI/4)+((player.charge-1)*Math.PI/2)));
      ball.x = player.x;
      ball.y = player.y;
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
var stepPlayers = setInterval(function(){
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
      for(var i = 0; i <  balls.length; i++){
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
