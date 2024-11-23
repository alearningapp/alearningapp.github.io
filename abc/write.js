const canvas = document.getElementById("canvas");
const canvasbg = document.getElementById("canvasbg");
const playBtn = document.getElementById("playBtn");
const clearBtn = document.getElementById("clearBtn");
const ctx = canvas.getContext("2d");
const ctxbg = canvasbg.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const container = document.getElementById("container");


let isRecording = false;
let isPlaying = false;
let recordedData = [];
let isDrawing = false;
let lastDrawTime = 0;

playBtn.addEventListener("click", playAnimation);
clearBtn.addEventListener("click", reset);
canvas.addEventListener("touchstart", startDrawing);
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("touchend", stopDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("touchmove", draw);
colorPicker.addEventListener("change", (e) => {
  const color = e.target.value;
  ctx.strokeStyle = color;
});


function resizeCanvas() {
  canvasbg.width = canvas.width = container.offsetWidth;
  canvasbg.height= canvas.height = container.offsetHeight;
  drawGrid();
}

window.addEventListener("resize", resizeCanvas);

// Initial resizing
resizeCanvas();

function reset() {
  recordedData.length = 0;
  clearCanvas();
}

function playAnimation() {
  if (recordedData.length === 0) {
    return;
  }
  isPlaying = true;
  clearCanvas();
  animate();
}

function getOffset(e) {
  if(e.touches){
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    return { offsetX, offsetY };
  }else {
    let {offsetX,offsetY} = e;
    return {offsetX,offsetY};
  } ;

}
function startDrawing(event) {
  console.log("down");
  isRecording = true;
  if (!isRecording) {
    return;
  }
  isDrawing = true;
  lastDrawTime = new Date();

  ctx.beginPath();

  let { offsetX, offsetY } = getOffset(event);

  ctx.moveTo(offsetX, offsetY);
  recordedData.push({ x: offsetX, y: offsetY, t: -1 });
}

function stopDrawing() {
  isDrawing = false;
  console.log("stop");
}

function draw(event) {
  console.log("draw");

  if (!isRecording || !isDrawing) {
    return;
  }
  let { offsetX, offsetY } = getOffset(event);
  recordedData.push({
    x: offsetX,
    y: offsetY,
    t: new Date().getTime() - lastDrawTime.getTime(),
    color: ctx.strokeStyle,
    width: ctx.lineWidth,
  });
  ctx.lineTo(offsetX, offsetY);
  ctx.stroke();
  lastDrawTime = new Date();
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function animate() {
  if (!isPlaying) {
    return;
  }
  clearCanvas();
  ctx.beginPath();

  for (let i = 0; i < recordedData.length; i++) {
    const { x, y, t, color, width } = recordedData[i];
    console.log(x, y, t);

    if (t < 0) {
      ctx.beginPath();

      ctx.moveTo(x, y);
    } else {
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    await sleep(t);
  }
}

const slider = document.getElementById("lineWidthSlider");
slider.addEventListener("input", handleLineWidthChange);

function handleLineWidthChange() {
  const lineWidth = slider.value;
  ctx.lineWidth = lineWidth;
}

// Set default line width
ctx.lineWidth = slider.value;

const gridBtn = document.getElementById("grid");

gridBtn.addEventListener("click", toggleGrid);


let enableGrid=true;
function toggleGrid(){
  console.log(enableGrid)
  enableGrid=!enableGrid;
  canvasbg.style.display=enableGrid?'':'none';
}
// Function to draw the grid
function drawGrid() {

  ctxbg.strokeStyle = "#aaa";
  ctxbg.lineWidth = 1;
  const lineSpacing = 40; // 调整每行的间距

  
  ctx.lineWidth = 1;
  
  let cyh=lineSpacing;
  while(true){
  
  for (let i = 1; i <= 4; i++) {
  
    cyh +=  lineSpacing;
    if(cyh>canvasbg.height)return;
    ctxbg.beginPath();
    ctxbg.moveTo(0, cyh);
    ctxbg.lineTo(canvasbg.width, cyh);
    ctxbg.stroke();
  
  }
  cyh+=lineSpacing;
}

}
