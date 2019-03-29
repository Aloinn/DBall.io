var socket = io();

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
    ctx.arc(player.x, player.y, 20, 0, 2 * Math.PI, false);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.lineWidth = 3;
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

//          PLAYER INPUT
// MOUSE CLICK
// CHECK FOR MOUSE INPUT
canvas.addEventListener("mousedown", doMouseDown, false);

function doMouseDown(event){
  console.log(getMousePos(canvas,event));
  socket.emit('mouse', getMousePos(canvas,event));
}

// GET MOUSE COORDINATES
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: Math.round((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
        y: Math.round((evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
    };
}
// WASD
// MOVEMENT OBJECT
var movement = {
  up:false,
  down:false,
  right:false,
  left:false,
  speed:5
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
}, 1000/60);

//DEBUG
socket.on('message', function(data) {
  console.log(data);
});
