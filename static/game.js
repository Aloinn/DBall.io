var socket = io();
// PLAYER INPUT
var movement = {
  up:false,
  down:false,
  right:false,
  left:false
}

// CHECK FOR INPUT

document.addEventListener("keydown",keyDownHandler,false);
document.addEventListener("keyup",keyUpHandler,false);

function keyDownHandler(a){
  if(a.which===65){movement.left = true;}
  if(a.which===87){movement.up = true;}
  if(a.which===68){movement.right = true;}
  if(a.which===83){movement.down = true;}
}
function keyUpHandler(a){
  if(a.which===65){movement.left = false;}
  if(a.which===87){movement.up = false;}
  if(a.which===68){movement.right = false;}
  if(a.which===83){movement.down = false;}
}
// SEND USER INPUT
// SENDS A CALL FOR THE 'new player' FLAG TO SERVER
socket.emit('new player');

// SENDS A CALL FOR 'movement' WHICH DATA CONCERNING MOVEMENT
setInterval(function() {
  socket.emit('movement', movement);
  console.log(movement);
}, 1000/60);

//DEBUG
socket.on('message', function(data) {
  console.log(data);
});

// DISPLAY
var canvas = document.getElementById("myCanvas");
canvas.width = 800;
canvas.height = 600;
var ctx = canvas.getContext("2d");

// DRAW THE CLIENT SCREEN BY DRAWING ALL PLAYER INSTANCES
socket.on('state',function(players){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(var id in players){
    var player = players[id];
    ctx.beginPath();
    ctx.arc(player.x, player.y, 40, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#003300';
    ctx.stroke();
    /*
    ctx.beginPath();
    console.log(player);
    ctx.arc(player.x, player.y, 15, 0, 2*Math.PI);
    ctx.fillStyle = "#00000";
    ctx.fill();
    ctx.closePath();*/
  }
});
