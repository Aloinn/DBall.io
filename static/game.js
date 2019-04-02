// ESTABLISH CONNECTION
var socket = io();
// PLAYING
var states = {
  menu: 0,
  playing: 1,
  dead: 2
}
Object.freeze(state);

// DISPLAY
var canvas = document.getElementById("myCanvas");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
var ratioX = canvas.width/800;
var ratioY = canvas.height/600;
var ctx = canvas.getContext("2d");
var state = states.menu;

// DRAW HANDS FOR THE PLAYER
function drawhands(object){
  ctx.beginPath();
  ctx.arc(
    (object.x*ratioX)+ object.angleN*(25*Math.cos(object.angle+(Math.PI/4)+((object.charge-1)*Math.PI/2))),
    (object.y*ratioY)+ object.angleN*(25*Math.sin(object.angle+(Math.PI/4)+((object.charge-1)*Math.PI/2))),
    10, 0, 2 * Math.PI, false);
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    (object.x*ratioX)+ object.angleN*(25*Math.cos(object.angle-(object.charging ? (Math.PI/8) : (Math.PI/4)))),
    (object.y*ratioY)+ object.angleN*(25*Math.sin(object.angle-(object.charging ? (Math.PI/8) : (Math.PI/4)))),
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
      ctx.arc((object.x*ratioX), (object.y*ratioY), 20, 0, 2 * Math.PI, false);
      ctx.fillStyle = object.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'black';
      ctx.stroke();
}
// DRAW NAME
function drawname(object){
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(object.name, (object.x*ratioX), (object.y*ratioY)+60);
}
// DRAW CHARGE
function drawcharge(object){
  ctx.beginPath();
  ctx.rect((object.x*ratioX)-45, (object.y*ratioY)+30, 15, (object.charge-1)*-60 );
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();
}
// DRAW BALL
function drawball(object){
  ctx.beginPath();
  ctx.arc((object.x*ratioX), (object.y*ratioY), 10, 0, 2 * Math.PI, false);
  ctx.fillStyle = "#efefef";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  ctx.stroke();
}
// RENDER FUNCTION TO READ OMMITTED DATA
function render(object){
  // IF OBJECT IS A PLAYER, DRAW THIS WAY
  if(object.type === 'player'){
    drawhands(object);
    drawbody(object);
    drawname(object);

    if(object.charging === true)
    {drawcharge(object);}

  } else if(object.type === 'ball'){
    drawball(object);
  }
}

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
  input.mouseX = Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width)/ratioX;
  input.mouseY = Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)/ratioY;
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
ctx.textAlign = "center";
var textinput = new CanvasInput({
  canvas: document.getElementById('myCanvas'),
  fontSize: 18,
  fontFamily: 'Arial',
  fontColor: '#212121',
  fontWeight: 'bold',
  width: 300,
  x: (canvas.width/2) - 155,
  y: (canvas.height/2),
  padding: 5,
  borderWidth: 3,
  borderColor: '#000',
  borderRadius: 0,
  boxShadow: '0px 0px 0px #fff',
  innerShadow: '0px 0px 0px rgba(0, 0, 0, 0.5)',
  textAlign: 'center',
  placeHolder: 'Name here',
  maxlength:16,
});

// SEND USER INPUT
// SENDS A CALL FOR THE 'new player' FLAG TO SERVER
textinput.render();

textinput.onsubmit(startGame);

function startGame(){
  state = states.playing;
  socket.emit('new player', textinput.value());
  textinput.destroy();
  // SENDS A CALL FOR 'input' WHICH DATA CONCERNING input
  setInterval(function() {
    socket.emit('input', input);
    //console.log(input);
  }, 1000/60);
}

// DRAW THE CLIENT SCREEN BY DRAWING ALL PLAYER INSTANCES
socket.on('state',function(objects){
  if(state === states.playing)
  {
    //CLEAR RECTANGLE
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // DRAW HALF CUTTING LINE
    ctx.beginPath();
    ctx.moveTo(canvas.width/2,0);
    ctx.lineTo(canvas.width/2,canvas.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";
    ctx.stroke();
    // DRAW EACH INDIVIDUAL OBJECT
    for(var id in objects){
      var object = objects[id];
      render(object);
    }
  }
});

//DEBUG
socket.on('message', function(data) {
  console.log(data);
});
