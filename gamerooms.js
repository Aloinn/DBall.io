module.exports = {
  // SORT PLAYERS INTO TEAMS FUNCTION
  //( takes room object variable )
  //( assigns players into red or blue depending on team sizes)
  makeTeams: function(room){
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
        room.blue.push({kills:0, deaths:0, name:player.name, ready:player.ready, })
      } else {
        room.red.push({kills:0, deaths:0, name:player.name, ready:player.ready, })
      }
    }
  },

  // SPAWN BALLS
  //( takes room object, and number of balls as params )
  //( creates ball objects inside the room )
  // BALL [ type, x, dx, y, dx, color, owner ]
  spawnBalls: function(room,numBalls){
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
  },

  // CREATE PLAYER
  //( takes player object )
  //( assigns default variables for player object )
  // PLAYER [ type, ball, angle, charge, charging, speed, speedmax ]
  createPlayer: function(player){
    player.type = 'player';
    player.ball = false;
    player.angle = 0;
    player.charge = 1;
    player.charging = false;
    player.speed = 4.5;
    player.speedmax = 4.5;
  },

  // START GAME
  //( takes room number as variable )
  //( sets the state of room to playing & spawn balls)
  //( spawns players left/right depending on player's teams )
  //( starts step process for room )
  startGame: function(rmnm){

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
    room.objects['timer'] = new Object();
    room.objects['timer'].type = 'timer';

    // START ROOM
    io.sockets.in(rmnm).emit('start game',rooms[rmnm]);
    room.stepEmit = stepEmit(rmnm,room.objects);
    delayStart(room);
  },

  // TIMER BEFORE GAME STARTS
  //( takes room object as variable )
  delayStart: function(room){
    // SECONDS TO COUNT DOWN
    var time = 4;
    room.objects['timer'].time = time+1;

    var timer = setInterval(function(){
      // IF TIME IS 0
      room.objects['timer'].time = time;
      if(time === -1){
        // CLEAR TIMER AND START STEP PROCESS
        clearInterval(timer);
        delete room.objects['timer'];
        room.state = states.playing;
        room.stepRoom = setInterval(()=>{stepRoom(room);}); // FIX THIS LATER
      } else {
        // SUBTRACT 1 SECOND FROM COUNTER
        time -=1;
      }
    },1000);
  },

  // END GAME
  // ( takes room object as variable )
  // ( stop running step processes and deletes room object )
  endGame: function(room){
    clearInterval(room.stepEmit);
    delete room;
  }
}
