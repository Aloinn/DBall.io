var socket = io();

// DISPLAY
var canvas = document.getElementById("myCanvas");
canvas.width = 800;
canvas.height = 600;
var ctx = canvas.getContext("2d");

function drawhands(object){
  ctx.beginPath();
  ctx.arc(
    object.x+ object.angleN*(25*Math.cos(object.angle+(object.charge*Math.PI/4))),
    object.y+ object.angleN*(25*Math.sin(object.angle+(object.charge*Math.PI/4))),
    10, 0, 2 * Math.PI, false);
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    object.x+ object.angleN*(25*Math.cos(object.angle-(object.charging ? (Math.PI/5) : (Math.PI/4)))),
    object.y+ object.angleN*(25*Math.sin(object.angle-(object.charging ? (Math.PI/5) : (Math.PI/4)))),
    10, 0, 2 * Math.PI, false);
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();

}
// RENDER FUNCTION TO READ OMMITTED DATA
function render(object){
  // IF OBJECT IS A PLAYER, DRAW THIS WAY
  if(object.type === 'player'){
    console.log(object.angle*180/Math.PI);
    drawhands(object);
    ctx.beginPath();
    ctx.arc(object.x, object.y, 20, 0, 2 * Math.PI, false);
    ctx.fillStyle = object.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.stroke();
  } else if(object.type === 'ball'){
    ctx.beginPath();
    ctx.arc(object.x, object.y, 10, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#efefef";
    ctx.fill();
    ctx.stroke();
  }
}

// DRAW THE CLIENT SCREEN BY DRAWING ALL PLAYER INSTANCES
socket.on('state',function(objects){
  //CLEAR RECTANGLE
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(var id in objects){
    var object = objects[id];
    render(object);
  }
});

//          PLAYER INPUT
// MOUSE CLICK
// CHECK FOR MOUSE INPUT
canvas.addEventListener("mousedown",  doMouseDown,  false);
canvas.addEventListener("mouseup",    doMouseUp,    false)
canvas.addEventListener("mousemove",  doMouseMove,  false);

function doMouseDown(event){
  socket.emit('mouse', true);
}

function doMouseUp(event){
  socket.emit('mouse', false);
}

// GET MOUSE COORDINATES
function doMouseMove(event){
  var rect = canvas.getBoundingClientRect();
  input.mouseX = Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
  input.mouseY = Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
}

// WASD
// input OBJECT
var input = {
  up:false,
  down:false,
  right:false,
  left:false,
  mouseX: 0,
  mouseY: 0,
}

// CHECK FOR INPUT
document.addEventListener("keydown",keyDownHandler,false);
document.addEventListener("keyup",keyUpHandler,false);

function keyDownHandler(a){
  if(a.which===65){input.left = true;}
  if(a.which===87){input.up = true;}
  if(a.which===68){input.right = true;}
  if(a.which===83){input.down = true;}
}
function keyUpHandler(a){
  if(a.which===65){input.left = false;}
  if(a.which===87){input.up = false;}
  if(a.which===68){input.right = false;}
  if(a.which===83){input.down = false;}
}

// SEND USER INPUT
// SENDS A CALL FOR THE 'new player' FLAG TO SERVER
socket.emit('new player');

// SENDS A CALL FOR 'input' WHICH DATA CONCERNING input
setInterval(function() {
  socket.emit('input', input);
  //console.log(input);
}, 1000/60);

//DEBUG
socket.on('message', function(data) {
  console.log(data);
});
