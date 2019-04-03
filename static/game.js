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
var ctx = canvas.getContext("2d");
var ratioX = 0;
var ratioY = 0;
var ratio = 0;
// SETTING UP THE CANVAS ASPECT RATIOS
function canvasetup(){
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  ratioX = canvas.width/800;
  ratioY = canvas.height/600;
  ratio  = Math.min(ratioX,ratioY);
}
window.addEventListener('resize',canvasetup);
canvasetup();

var state = states.menu;

// DRAW HANDS FOR THE PLAYER
function drawhands(object){
  ctx.beginPath();
  ctx.arc(
    (object.x*ratioX)+ object.angleN*(ratio*25*Math.cos(object.angle+(Math.PI/4)+((object.charge-1)*Math.PI/2))),
    (object.y*ratioY)+ object.angleN*(ratio*25*Math.sin(object.angle+(Math.PI/4)+((object.charge-1)*Math.PI/2))),
    10*ratio, 0, 2 * Math.PI, false);
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3*ratio;
  ctx.strokeStyle = 'black';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    (object.x*ratioX)+ object.angleN*(ratio*25*Math.cos(object.angle-(object.charging ? (Math.PI/8) : (Math.PI/4)))),
    (object.y*ratioY)+ object.angleN*(ratio*25*Math.sin(object.angle-(object.charging ? (Math.PI/8) : (Math.PI/4)))),
    10*ratio, 0, 2 * Math.PI, false);
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3*ratio;
  ctx.strokeStyle = 'black';
  ctx.stroke();
}

// DRAW MAIN BODY
function drawbody(object){
      ctx.beginPath();
      ctx.arc((object.x*ratioX), (object.y*ratioY), 20*ratio, 0, 2 * Math.PI, false);
      ctx.fillStyle = object.color;
      ctx.fill();
      ctx.lineWidth = 3*ratio;
      ctx.strokeStyle = 'black';
      ctx.stroke();
}
// DRAW NAME
function drawname(object){
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(object.name, (object.x*ratioX), (object.y*ratioY)+ (60*ratio));
}
// DRAW CHARGE
function drawcharge(object){
  ctx.beginPath();
  ctx.rect((object.x*ratioX)-(45*ratio), (object.y*ratioY)+(30*ratio), 15*(ratio), (object.charge-1)*-(60*ratio) );
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3*ratio;
  ctx.strokeStyle = 'black';
  ctx.stroke();
}
// DRAW BALL
function drawball(object){
  ctx.beginPath();

  if(object.owner != undefined){
    var player = object.owner;
    ctx.arc((object.x*ratioX) + player.angleN*(ratio*35*Math.cos(player.angle+(Math.PI/4)+((player.charge-1)*Math.PI/2)))
        , (object.y*ratioY) + player.angleN*(ratio*35*Math.sin(player.angle+(Math.PI/4)+((player.charge-1)*Math.PI/2)))
        , 10*ratio, 0, 2 * Math.PI, false);
  } else {
    ctx.arc((object.x*ratioX), (object.y*ratioY), 10*ratio, 0, 2*Math.PI, false);
  }
  ctx.fillStyle = "#efefef";
  ctx.fill();
  ctx.lineWidth = 3*ratio;
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

// REMOVE TEXT ON CLICK
function clearfield(){
  document.getElementById("name-input").value = "";
}

// FUNCTION TO CREATE NEW ROOM
function createRoom(){
  var name = document.getElementById("name-input").value;
  if(name ==="Enter your name here"){name = "Player"}
  socket.emit('new connection',name);
  socket.emit('create');
}

// RENDER ROOM WITH EACH NEW PLAYER
socket.on('renderRoom', function(room){
  var gui = document.getElementById("gui");
  gui.style.display = "none";
  var gui = document.getElementById("rooms");
  gui.style.display = "flex";
  for(var i = 0; i < room.red.length; i ++){
    var id = "rp"+(i+1).toString();
    document.getElementById(id).innerHTML = room.red[i];
  }
  for(var i = 0; i < room.blue.length; i ++){
    var id = "bp"+(i+1).toString();
    document.getElementById(id).innerHTML = room.blue[i];
  }
});

/*
// SENDS A CALL FOR THE 'new player' FLAG TO SERVER on STARTGAME
function startGame(){
  var gui = document.getElementById("gui");
  gui.style.display = "none";
  var name = document.getElementById("name-input").value;
  if(name ==="Enter your name here"){name = "Player"}
  state = states.playing;
  socket.emit('new player', name);
  // SENDS A CALL FOR 'input' WHICH DATA CONCERNING input
  setInterval(function() {
    socket.emit('input', input);
    //console.log(input);
  }, 1000/60);
}
*/

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
    ctx.lineWidth = 3*ratio;
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
