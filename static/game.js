var socket = io();

// DISPLAY
var canvas = document.getElementById("myCanvas");
canvas.width = 800;
canvas.height = 600;
var ctx = canvas.getContext("2d");

// DRAW HANDS FOR THE PLAYER
function drawhands(object){
  ctx.beginPath();
  ctx.arc(
    object.x+ object.angleN*(25*Math.cos(object.angle+(Math.PI/4)+((object.charge-1)*Math.PI/2))),
    object.y+ object.angleN*(25*Math.sin(object.angle+(Math.PI/4)+((object.charge-1)*Math.PI/2))),
    10, 0, 2 * Math.PI, false);
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    object.x+ object.angleN*(25*Math.cos(object.angle-(object.charging ? (Math.PI/8) : (Math.PI/4)))),
    object.y+ object.angleN*(25*Math.sin(object.angle-(object.charging ? (Math.PI/8) : (Math.PI/4)))),
    10, 0, 2 * Math.PI, false);
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();
}

// DRAW MAIN BODY
function drawbody(object){
      ctx.beginPath();
      ctx.arc(object.x, object.y, 20, 0, 2 * Math.PI, false);
      ctx.fillStyle = object.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'black';
      ctx.stroke();
}
// DRAW CHARGE
function drawcharge(object){
  ctx.beginPath();
  ctx.rect(object.x-45, object.y+30, 15, (object.charge-1)*-60 );
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();
  ctx.closePatH();
}
// RENDER FUNCTION TO READ OMMITTED DATA
function render(object){
  // DRAW TEXTBOX
  input.render();
  // IF OBJECT IS A PLAYER, DRAW THIS WAY
  if(object.type === 'player'){
    console.log(object.angle*180/Math.PI);
    drawhands(object);

    drawbody(object);
    if(object.charging === true)
    {drawcharge(object);}


  } else if(object.type === 'ball'){
    ctx.beginPath();
    ctx.arc(object.x, object.y, 10, 0, 2 * Math.PI, false);
    ctx.fillStyle = "#efefef";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'black';
    ctx.stroke();
  }
}

// DRAW THE CLIENT SCREEN BY DRAWING ALL PLAYER INSTANCES
socket.on('state',function(objects){
  //CLEAR RECTANGLE
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.beginPath();
  ctx.moveTo(canvas.width/2,0);
  ctx.lineTo(canvas.width/2,canvas.height);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "black";
  ctx.stroke();
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
canvas.addEventListener("click",      doMouseClick, false)

function doMouseDown(event){
  socket.emit('mouse', 1);
}

function doMouseUp(event){
  socket.emit('mouse', 2);
}

function doMouseClick(event){
  socket.emit('mouse', 0);
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

// INPUT BOX

var input = new CanvasInput({
  canvas: document.getElementById('myCanvas'),
  fontSize: 18,
  fontFamily: 'Arial',
  fontColor: '#212121',
  fontWeight: 'bold',
  width: 200,
  padding: 8,
  borderWidth: 1,
  borderColor: '#000',
  borderRadius: 3,
  placeHolder: 'Enter name here'
});

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
