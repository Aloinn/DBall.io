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

                  /////////////////////////
                  /// SERVER SIDE LOGIC ///
                  /////////////////////////
// INIT VARIABLES
var cwidth = 800;
var cheight = 600;

var states = {
  "waiting":0,
  "playing":1,
  "scoreboard":2,
}
Object.freeze(states);

// MAKES A LIST OF ROOM
var rooms = {};

// MAKES RANDOM ID ( returns 4 digit string )
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 4; i++)
  {text += possible.charAt(Math.floor(Math.random() * possible.length))};
  return text;
}

// SORT PLAYERS INTO TEAMS FUNCTION
//( takes room object variable )
//( assigns players into red or blue depending on team sizes)
function makeTeams(room){
  // CLEARS TEAMS
  room.blue.length = 0;
  room.red.length = 0;

  for(var i = 0; i < room.players.length; i ++){
    // ITERATES ALL PLAYER OBJECTS IN ROOM USING
    // ID FROM ROOM'S PLAYER ARRAY
    var player = players[room.players[i]];
    var kd = player.kills;
    var pd = player.deaths;

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
      room.blue.push({kills:kd, deaths:pd, name:player.name, ready:player.ready, })
    } else {
      room.red.push({kills:kd, deaths:pd, name:player.name, ready:player.ready, })
    }
  }
}

// CHECKS TO SEE IF THERE ARE ANY BLUE OR RED PLAYERS STILL IN GAME
function checkRound(room, objects){
  // TEAM STILL HAS MEMBER?
  var red = false;
  var blue = false;
  for(var id in objects){
    var player = objects[id];
    if(player.type === 'player'){
      if(player.team === 'blue')
      {blue = true;}
      if(player.team === 'red')
      {red = true;}
    }
  }
  console.log(red);
  console.log(blue);
  // IF ONE TEAM IS OUT OF PLAYERS
  if(!red || !blue){
    room.objects['broadcast'] = new Object();
    room.objects['broadcast'].type = 'broadcast';
    var message = "";
    if(red){
      // RED TEAM WINS
      message = "RED \n WINS";
    } else {
      // BLUE TEAM WINS
      message = "BLUE \n WINS";
    }
    room.objects['broadcast'].message = message;
  }
}
// SPAWN BALLS
//( takes room object, and number of balls as params )
//( creates ball objects inside the room )
// BALL [ type, x, dx, y, dx, color, owner ]
function spawnBalls(room,numBalls){
  for(var i = 0; i < numBalls; i++){

    room.balls[i] = new Object();
    var ball = room.balls[i];
    ball.type = 'ball';
    ball.x = cwidth/2;
    ball.dx = 0;
    ball.y = cheight*(1+i)/(numBalls+1);
    ball.dy = 0;
    ball.active = false;
    ball.color = "#efefef";
    ball.team = undefined;
    ball.owner = undefined;
    ball.prevowner = undefined;
    room.objects['ball'+i.toString()] = ball;
  }
}

// CREATE PLAYER
//( takes player object )
//( assigns default variables for player object )
// PLAYER [ type, ball, angle, charge, charging, speed, speedmax ]
function createPlayer(player){
  player.type = 'player';
  player.ball = false;
  player.angle = 0;
  player.charge = 1;
  player.charging = false;
  player.speed = 4.5;
  player.speedmax = 4.5;
}

// START GAME
//( takes room number as variable )
//( sets the state of room to playing & spawn balls)
//( spawns players left/right depending on player's teams )
//( starts step process for room )
function startGame(rmnm){

  var room = rooms[rmnm];
  room.state = states.starting;
  spawnBalls(rooms[rmnm], Math.max(1,Math.ceil(room.players.length/2)+1));

  // TEMP VARIABLES FOR CALCULATIONS
  var blues = room.blue.length;
  var bb = 1;
  var reds = room.red.length;
  var rr = 1;

  // PUTS PLAYERS LEFT/RIGHT
  for(var i = 0; i < room.players.length; i ++){
    var player = players[room.players[i]];
    // AT START OF GAME SET PLAYERS KILLS & DEATHS TO 0
    player.kills = 0;
    player.deaths = 0;

    room.objects[room.players[i]] = player;
    // SPAWN PLAYERS ACCORDING TO TEAM
    if(player.team === 'blue'){
      player.x = cwidth*0.25;
      player.y = cheight*bb / (blues+1)
      bb += 1;
      player.color = 'dodgerBlue';
    } else {
      player.x = cwidth*0.75
      player.y = cheight*rr*1 / (reds+1)
      rr += 1;
      player.color = 'tomato';
    }
    createPlayer(player);
  }
  // ADDS TIMER
  room.objects['broadcast'] = new Object();
  room.objects['broadcast'].type = 'broadcast';

  // START ROOM
  io.sockets.in(rmnm).emit('start game',rooms[rmnm]);
  room.stepEmit = stepEmit(rmnm,room.objects);
  delay(room);
}

// TIMER BEFORE GAME STARTS
//( takes room object as variable )
function delay(room){
  // SECONDS TO COUNT DOWN
  var time = 4;
  room.objects['broadcast'].message = time+1;

  var timer = setInterval(function(){
    // IF TIME IS 0
    room.objects['broadcast'].message = time;
    if(time === -1){
      // CLEAR TIMER AND START STEP PROCESS
      clearInterval(timer);
      delete room.objects['broadcast'];
      room.state = states.playing;
      room.stepRoom = setInterval(()=>{stepRoom(room);}); // FIX THIS LATER
    } else {
      // SUBTRACT 1 SECOND FROM COUNTER
      time -=1;
    }
  },1000);
}

// END GAME
// ( takes room object as variable )
// ( stop running step processes and deletes room object )
function endGame(room){
  clearInterval(room.stepEmit);
  delete room;
}

var connected = 0;
io.on('connection',function(socket){
  connected +=1;
  io.sockets.emit('global players', connected);
  // NEW CONNECTION
  socket.on('new connection',function(name){
    players[socket.id] = new Object();
    var player = players[socket.id];
    player.name = name;
    player.rm = 0;
    player.ready = false;
    player.team = "undeclared";
    player.kills = 0;
    player.deaths = 0;
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
    var room = rooms[rmnm];

    room.rmnm = rmnm;
    room.state = states.waiting;

    room.players = [];
    room.players.push(socket.id);

    room.balls = [];
    room.objects = {}

    room.blue = [];
    room.red = [];

    room.stepPlayers = 0;
    room.stepBalls = 0;

    makeTeams(room);

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
    var rmnm = player.rm;

    // TOGGLES READY VARIABLE CHANGE
    if(rooms[rmnm].states === states.menu){
      player.ready ? player.ready = false : player.ready = true;
      makeTeams(rooms[rmnm]);
      io.sockets.in(rmnm).emit('renderRoom',rooms[rmnm]);
    }

    // ITERATES THROUGH ALL PLAYERS IN ROOM
    if(player.ready === true){
      for(var i = 0; i < rooms[rmnm].players.length; i ++){
        if(players[rooms[rmnm].players[i]].ready === false)
        {break;} else {
          // IF LAST PLAYER IS READY
          if(i === (rooms[rmnm].players.length - 1))
          {startGame(player.rm);}
        }
      }
    }
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
    players[playerid].x = 300;
    players[playerid].y = 300;
    players[playerid].color = "#"+((1<<24)*Math.random()|0).toString(16);
    createPlayer(players[playerid]);
  })

  // WHEN PLAYER CLICKS
  socket.on('mouse',function(click){
    var player = players[socket.id] || {};
    switch(click){
      case 1: // MOUSE DOWN
        if(player.ball === true){
          player.charging = true;
        }
        break;
      case 2: // MOUSE UP
        if(player.ball === true && player.charging === true){
          player.ball = false;
          player.charging = false;
        }
        break;
    }
  })

  // WHEN PLAYER MOVES
  socket.on('input', function(data) {
    var player = players[socket.id] || {};

    // CHECK IF ROOM IS STARTING OR PLAYING
    if(player.rm && rooms[player.rm] && rooms[player.rm].state === states.playing){
      // MOVEMENT
      var speed = player.speed/Math.pow(player.charge,1.05);
      if((data.up||data.down)&&(data.left||data.right))
      {speed = 0.7*speed}

      if(data.up    && player.y - speed > 0)            {player.y-=speed}
      if(data.down  && player.y + speed < cheight)      {player.y+=speed}
      // IF PLAYER IS ON BLUE TEAM, CAN NOT CROSS CENTER
      if(player.team === "blue"){
        if(data.left  && player.x - speed > 0)            {player.x-=speed}
        if(data.right && player.x + speed < cwidth/2)       {player.x+=speed}
      } else {
        // ELSE IF PLAYER IS ON RED TEAM CAN NOT CROSS CENTER
        if(data.left  && player.x - speed > cwidth/2)            {player.x-=speed}
        if(data.right && player.x + speed < cwidth)       {player.x+=speed}
      }
    }
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

    // IF PLAYER IS IN ROOM & ROOM EXISTS AND PLAYER IS LAST ONE
    if(player.rm && rooms[player.rm] && rooms[player.rm].players && rooms[player.rm].players.length == 1){
      endGame(rooms[player.rm]);
      delete rooms[player.rm];
    }

    else if(player.rm && rooms[player.rm]){
      disconnectLobby(player.rm, socket, false)
    }
  });

  // WHEN PLAYER DISCONNECTS SUDDENLY
  socket.on('disconnect',function(){
    // TELLS EVERYONE A PLAYER HAS DISCONNECTED
    connected -=1;
    io.sockets.emit('global players', connected);

    var player = players[socket.id] || {};

    // IF PLAYER HAS VARIABLES THEN DELETE THEM
    if(typeof player.charge != undefined){
      player.charge = 0;
      player.ball = false;
    }

    // If player is last player in room, delete room
    if(player.rm && rooms[player.rm] &&rooms[player.rm].players && rooms[player.rm].players.length == 1){
        endGame(rooms[player.rm]);
        delete rooms[player.rm];
      }
    // ELSE IF NOT LAST PERSON IN ROOM
    else if(player.rm && rooms[player.rm]){
      disconnectLobby(player.rm, socket, true);
      makeTeams(rooms[player.rm]);
      checkRound(rooms[player.rm],rooms[player.rm].objects);
    }

    // Delete player
    delete players[socket.id];
  })
});

// DISCONNECT PLAYER FROM ROOM
function disconnectLobby(rmnm,socket,dc){
  // ITERATES THROUGH ALL PLAYERS IN ROOM'S PLAYER ARRAY
  for(var i = 0; i < rooms[rmnm].players.length; i ++){
    rooms[rmnm].players = rooms[rmnm].players.filter(player => player != socket.id)
  }
  // ITERATES THROUGH ALL OBJECTS IN ROOM'S OBJECT ARRAY
  delete rooms[rmnm].objects[socket.id]

  // RERENDERS FOR ALL PLAYER
  if(rooms[rmnm].state == states.waiting){
    makeTeams(rooms[rmnm]);
    socket.to(rmnm).emit('renderRoom',rooms[rmnm]);
  }
}

                    //////////////////
                    /// GAME LOGIC ///
                    //////////////////

// INIT LIST OF PLAYERS & BALLS
var players = {};
var gameSpeed = 1000/60;

// DEACTIVATE BALLS
//( takes a ball object as variable )
//( deactivates by setting a number of variables to false)
function deactivateBall(ball){
  ball.color = "#efefef";
  ball.prevowner = undefined;
  ball.team = undefined;
  ball.owner = undefined;
  ball.active = false;
}

// ACTIVATE BALLS
//( takes a ball and and owner as variables)
function activateBall(ball, owner){
  ball.color = "#efefef";
  ball.prevowner = owner;
  ball.team = ball.owner.team;
  ball.owner = undefined;
}

// STEP BALLS
//( takes a ball from the room )
//( dampens ball speed each step )
//( checks for ball to player collisions & ball to wall )
//( player throwball physics )
function stepBalls(ball){

  // CHECKS IF BALL HAS OWNER
  if(ball.owner === undefined){
    // CHECK FOR BALL BOUNCE ON X
    if(ball.x + ball.dx < 0 || ball.x + ball.dx > cwidth){
      deactivateBall(ball);
      ball.dx = -ball.dx;
      ball.dy *= 0.5;
      ball.dx *= 0.5;
    } else {// OTHERWISE FOLLOW SPEED
      ball.x += ball.dx;
      ball.dx *= 0.9985
    }

    // CHECK FOR BALL BOUNCE ON Y
    if(ball.y + ball.dy < 0 || ball.y + ball.dy > cheight){
      deactivateBall(ball);
      ball.dy = -ball.dy;
      ball.dy *= 0.5;
      ball.dx *= 0.5;
    } else { // OTHERWISE FOLLOW SPEED
      ball.y += ball.dy;
      ball.dy *= 0.9985
    }

    // DAMPEN SPEED IF TOTAL SPEED IS LESS THAN 2
    var spd = Math.sqrt(Math.pow(ball.dy,2)+Math.pow(ball.dx,2));

    // IF SPEED IS LESS THAN 0.3
    if(spd < 0.03){
      ball.dy = 0;
      ball.dx = 0;
    }
    // IF SPEED IS LESS THAN 0.1
    if(spd < 0.1)
    {deactivateBall(ball)}
  // IF BALL DOESNT HAVE OWNER
  } else {
    ball.color = 'gray';
    var player = ball.owner;
    // SET POSITION FOR THE BALL RELATIVE TO DIRECTION PLAYER FACSE
    //ball.x = player.x+ player.angleN*(35*Math.cos(player.angle+(Math.PI/4)+((player.charge-1)*Math.PI/2)));
    ball.x = player.x;
    ball.y = player.y;
    // IF PLAYER JUST THREW THIS BALL
    if(player.ball === false){
      if( // IF THE BALL DOESNT SPAWN OUTSIDE THE CANVAS
          (player.x + player.angleN*50*Math.cos(player.angle) < cwidth) &&
          (player.x + player.angleN*50*Math.cos(player.angle) > 0) &&
          (player.y + player.angleN*50*Math.sin(player.angle) < cheight) &&
          (player.y + player.angleN*50*Math.sin(player.angle) > 0)
        ) {
          // THEN SHOOT THE BALL =>

          // SETS POSITION
        ball.x = player.x+ player.angleN*(50*Math.cos(player.angle));
        ball.y = player.y+ player.angleN*(50*Math.sin(player.angle));
          // SET SPEED
        ball.dx = player.angleN*Math.pow(player.charge,1.15)*Math.cos(player.angle);
        ball.dy = player.angleN*Math.pow(player.charge,1.15)*Math.sin(player.angle);
          // SET BALL'S TEAM
        ball.team = ball.owner.team
          // SET PREV OWNER
        ball.prevowner = ball.owner;
        ball.owner = undefined;
          // SET BALL ACTIVE
        ball.active = true;
          // CLEAR PLAYER'S CHARGE BAR
        player.charge = 1;
      }
    }
  }
}

// STEP PLAYERS
//( takes a player object and list of balls from the room )
//( checks if player is charging )
//( checks if player collides with any balls )
function stepPlayers(player, balls, id, objects){
  // CHARGE UP THROW
  if(player.charging === true){
    if(player.charge < 2){
      player.charge+= 0.00065;
    }
  }
  // CHECK BALL PICKUP
  if(player.ball === false){
    // IF ONE OF THE NUM OF BALLS TOUCHES PLAYER, PLAYER OWNS IT
    // ITERATES THROUGH BALLS
    for(var i = 0; i <  balls.length; i++){
      var ball = balls[i];
      // IF BALL COLLIDES WITH PLAYER
      if(Math.abs(ball.x - player.x)<30 && Math.abs(ball.y - player.y)<30 && ball.owner === undefined){
        // IF BALL IS NOT ACTIVE, LET PLAYER PICK UP
        if(ball.active === false) {
          //ball.color = 'gray';
          ball.owner = player;
          player.ball = true;
        }
        // IF BALL IS ACTIVE AND NOT ON PLAYER'S TEAM
        if(ball.active === true && ball.team != player.team){
          // IF BALL HIS PLAYER && BALL IS NOT THROWN BY PLAYERS TEAM MEMBER
          player.deaths += 1;
          ball.prevowner.kills += 1;
          makeTeams(rooms[player.rm]);
          delete objects[id];
          checkRound(rooms[player.rm],rooms[player.rm].objects);
        }
      }
    }
  }
}

// STEP PLAYERS
//( takes the room object as variable )
//( checks if object is ball or player and send them to according method )
function stepRoom(room){
  var objects = room.objects;
  var balls = room.balls;
  // ITERATES ALL OBJECTS
  for(var id in objects){
    // SETS THE OBJECT AS THE CORRESPONDING ITEM FROM ARRAY
    var object = objects[id];
    // IF ITERATED OBJECT IS IS A PLAYER
    if(object.type === 'player')
    {stepPlayers(object,balls,id,objects);}
    else if (object.type ==='ball')
    {stepBalls(object);}
  }
}

// SENDS DRAW FLAG TO ALL CLIENTS
//( takes room number and list of objects in room as variables )
//( sends all client in room a list of objetcs to render )
function stepEmit(rmnm, objects){
  return setInterval(function(){
    io.sockets.in(rmnm).emit('state',objects,rooms[rmnm].red,rooms[rmnm].blue);
  }, gameSpeed);
}
