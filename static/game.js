var socket = io();
// PLAYER INPUT
function movement(){
  up:false;
  down:false;
  right:false;
  left:false;
}

// CHECK FOR INPUT
function inputkeydown(a){
  switch(a.keyCode){
    case 65: // A
      movement.left = true;
      break;
    case 87: // W
      movement.up = true;
      break;
    case 68: // D
      movement.right = true;
      break;
    case 83: // S
      movement.down = true;
      break;
  }
}

function inputkeyup(a){
  switch(a.keyCode){
    case 65: // A
      movement.left = false;
      break;
    case 87: // W
      movement.up = false;
      break;
    case 68: // D
      movement.right = false;
      break;
    case 83: // S
      movement.down = false;
      break;
  }
}
document.addEventListener('keydown',inputkeydown)
document.addEventListener('keyup',inputkeyup)

// SEND USER INPUT
// SENDS A CALL FOR THE 'new player' FLAG TO SERVER
socket.emit('new player');

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
    ctx.arc(player.x, player.y, 15, 0, 2*Math.PI);
    ctx.fillStyle = "#00000";
    ctx.fill();
    ctx.closePath();
  }
});

/*
// SENDS A CALL WITH MOVEMENT INFORMATION TO THE SERVER
function sendMovement(){
  // SENDS A CALL THAT GIVES NEW MOVEMENT
  socket.emit('movement',movement);
} setInterval(sendMovement,1000/60); // send movement every 1000/60

// DISPLAY
var canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;
var ctx = canvas.getContext('2d');

// DRAWS PLAYERS BASED ON SERVER'S DATA
socket.on('state',function(players){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  context.fillStyle = 'green';
  // DRAW EVERY PLAYER INDIVIDUALLY
  for(var id in players){
    var player = players[id];
    ctx.beginPath();
    ctx.arc(player.x, player.y, 10, 0, 2*Math.pi);
    ctx.closePath();
  }
});
*/
// CONNECTS
