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
  ratio = Math.min(ratio,1.2)
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
  ctx.fillStyle = object.color;
  ctx.fill();
  ctx.lineWidth = 3*ratio;
  ctx.strokeStyle = 'black';
  ctx.stroke();
}

function drawTime(time){
  var displayTime = time;
  if(time === 0)
  {displayTime = "GO!"}

  ctx.font = "bold 300px Arial";
  ctx.fillStyle = "#efefef";
  ctx.fillText(displayTime,canvas.width/2,canvas.height*3/5)
  ctx.strokeText(displayTime,canvas.width/2, canvas.height*3/5);
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
  } else if(object.type === 'timer'){
    drawTime(object.time);
  }
}

//          PLAYER INPUT
// MOUSE CLICK
// CHECK FOR MOUSE INPUT
canvas.addEventListener("mousedown",  doMouseDown,  false);
canvas.addEventListener("mouseup",    doMouseUp,    false)
canvas.addEventListener("mousemove",  doMouseMove,  false);

function doMouseDown(event){
  socket.emit('mouse', 1);
}

function doMouseUp(event){
  socket.emit('mouse', 2);
}

// GET MOUSE COORDINATES
function doMouseMove(event){
  var rect = canvas.getBoundingClientRect();
  input.mouseX = Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width)/ratioX;
  input.mouseY = Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)/ratioY;
}

// WASD
// INPUT OBJECT
var input = {
  shift:false,
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
  if(a.shiftKey)  {input.shift = true;}
}
function keyUpHandler(a){
  if(a.which===65){input.left = false;}
  if(a.which===87){input.up = false;}
  if(a.which===68){input.right = false;}
  if(a.which===83){input.down = false;}
  if(a.which===16){input.shift = false;}
}

                        ///////////////
                        // MAIN MENU //
                        ///////////////

// TEXT INPUTS TO GET VALUES FROM
var nameBox = document.getElementById("name-input");
var codeInput = document.getElementById("code-input");
var codeValue = document.getElementById("code-num");
// SECTIONS TO DISPLAY
var mainSection = document.getElementById("main-section");
var lobbySection = document.getElementById("lobby-section");
var joinSection = document.getElementById("join-section");
// LEADERBOARD
var leaderboard = document.getElementById("leaderboard-section");
function displaySection(display){
  mainSection.style.display = "none";
  lobbySection.style.display = "none";
  joinSection.style.display = "none";
  if(display)
  {display.style.display = "flex";}
  // RESET TEXT INSIDE INPUT
  if(display === mainSection)
  {nameBox.value = "Enter your NAME here"}
  if(display === joinSection)
  {codeInput.value = "Enter your CODE here";}
}

// SETS NAME TO PLAYER IF NO INPUT OR EMPTY STRING
function nameCheck(){
  if (nameBox.value == null || nameBox.value.trim() === '' || nameBox.value ==="Enter your NAME here")
  {nameBox.value = "Player"}
}

// REMOVE TEXT ON CLICK
function clearfield(){
  nameBox.value = "";
}

function clearfieldCode(){
  codeInput.value = "";
}

// FUNCTION TO CREATE NEW ROOM
function createRoom(){
  nameCheck();
  socket.emit('new connection',nameBox.value);
  socket.emit('create');
}

// FUNCTION TO JOIN TEAM
function joinRoomInput(){
  displaySection(joinSection);
}
// FUNCTION WHEN THERS A ROOM CODE INPUT
function joinRoom(){
  nameCheck();
  socket.emit('new connection',nameBox.value);
  socket.emit('join', codeInput.value);
}
// IF NO ROOMS WERE FOUND
socket.on('no room',function(fail){
  codeInput.value = fail;
})

function backToMenu(){
  socket.emit('leave room');
  displaySection(mainSection);
}
// RENDER ROOM WITH EACH NEW PLAYER
socket.on('renderRoom', function(room){

  // CLEAR ALL PLAYER ENTRIES
  for(var i = 0; i < 5; i ++){
    var id = "rp"+(i+1).toString();
    document.getElementById(id).innerHTML = '';
    document.getElementById(id).style.backgroundImage = "none";
  }
  for(var i = 0; i < 5; i ++){
    var id = "bp"+(i+1).toString();
    document.getElementById(id).innerHTML = '';
    document.getElementById(id).style.backgroundImage = "none";
  }

  // REMOVE ALL GUIS EXCEPT LOBBY SECTION
  displaySection(lobbySection);
  codeValue.innerHTML = room.rmnm;

  for(var i = 0; i < room.red.length; i ++){
    var id = "rp"+(i+1).toString();
    var textbox =   document.getElementById(id);
    textbox.innerHTML = room.red[i].name;
    room.red[i].ready ? textbox.style.backgroundImage = "url('/static/checkmark.png')" : textbox.style.backgroundImage = "none";
  }
  for(var i = 0; i < room.blue.length; i ++){
    var id = "bp"+(i+1).toString();
    var textbox =   document.getElementById(id);
    textbox.innerHTML = room.blue[i].name;
    room.blue[i].ready ? textbox.style.backgroundImage = "url('/static/checkmark.png')" : textbox.style.backgroundImage = "none";
  }
});

// WHEN PLAYER GETS READY
function playerReady(){
  socket.emit('player ready');
}

// PLAYER SWITCH TEAMS
function switchTeams(){
  socket.emit('switch teams');
}

// DRAW LEADERBOARD
function drawLeaderboard(red,blue){
  console.log('red');
  console.table(red);
  console.log('blue');
  console.table(blue);
  leaderboard.style.display = 'flex';

  for(var i = 0; i < 5; i ++){
    var name =   document.getElementById(   "lbp"+(i+1).toString());
    var kills =   document.getElementById(  "bp"+(i+1).toString()+"k");
    var deaths =   document.getElementById( "bp"+(i+1).toString()+"d");
    if(blue[i]){
      name.innerHTML = blue[i].name;
      kills.innerHTML = blue[i].kills.toString();
      deaths.innerHTML = blue[i].deaths.toString();
    } else {
      name.innerHTML = ''
      kills.innerHTML = ''
      deaths.innerHTML = ''
    }
  }

  for(var i = 0; i < 5; i ++){
    var name =   document.getElementById(   "lrp"+(i+1).toString());
    var kills =   document.getElementById(  "rp"+(i+1).toString()+"k");
    var deaths =   document.getElementById( "rp"+(i+1).toString()+"d");
    if(red[i]){
      name.innerHTML = red[i].name;
      kills.innerHTML = red[i].kills.toString();
      deaths.innerHTML = red[i].deaths.toString();
    } else {
      name.innerHTML = ''
      kills.innerHTML = ''
      deaths.innerHTML = ''
    }
  }
}

function clearLeaderboard(){
  leaderboard.style.display = 'none';
}
// START GAME CALL
socket.on('start game',function(){
  displaySection();
  state = states.playing;
  setInterval(function() {
    socket.emit('input', input);
  }, 1000/60);
});

// DRAW THE CLIENT SCREEN BY DRAWING ALL PLAYER INSTANCES
socket.on('state',function(objects,red,blue){
  // IF SHIFT/TAB IS PRESSED
  if(input.shift === true)
  {drawLeaderboard(red,blue);}
  else
  {clearLeaderboard(red,blue);}
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
});

var numplayers = document.getElementById("numplayersamount")

socket.on('global players',function(num){
  numplayers.innerHTML = num;
})
//DEBUG
socket.on('message', function(data) {
  console.log(data);
});
