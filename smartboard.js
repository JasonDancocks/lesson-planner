var stage = setStage();
var params = initialize();


//testing

//next steps

// refactor

//Initialise methods
function initialize() {
  var params = setParams();

  addBackground(params);
  addMainLayer(params);
  setToolBar();
  setColorPalette();
  return params;
}

function setParams() {
  var params = {};

  params.shapeInfo = {};
  params.isMouseDragging = false;
  params.currentTool = "select";
  params.selected = "none";
  params.currentColor = "red";
  

  return params;
}

function setToolBar() {
  var toolBar = Array.from(document.getElementById("buttons").children);

  toolBar.forEach(function (element) {
    element.addEventListener("click", function () {
      setCurrentTool(element);
    });
  });

  return toolBar;
}

function setStage() {
  var stage = new Konva.Stage({
    container: "canvas-container",
    width: 500,
    height: 500,
    id: "canvas"
  });

  return stage;
}

function addBackground(params) {
  var width = stage.width();
  var height = stage.height();
  var backgroundLayer = new Konva.Layer();
  var background = new Konva.Rect({
    x: 0,
    y: 0,
    width: width,
    height: height,
    fill: "white",
    id: "background"
  });

  backgroundLayer.add(background);
  stage.add(backgroundLayer);
}

function addMainLayer() {
  var mainLayer = new Konva.Layer({
    id: "mainLayer"
  });
  stage.add(mainLayer);
}

// event handlers

stage.on("mousedown touchstart", function () {
  getStartPosition();
  params.isMouseDragging = true;
});

stage.on("mousemove touchmove", function(event) {
  if (params.isMouseDragging) {
    setDragSize();
    removePrevious();
    useTool(event);
  }
});

stage.on("mouseup touchend", function (event) {
  params.isMouseDragging = false;
  params.shapeInfo = {};

  if (params.currentTool === "select" || params.currentTool === "delete") {
    useTool(event);
  }
});

//event helpers
function getStartPosition() {
  params.shapeInfo.startPosition = stage.getPointerPosition();
}

function setDragSize() {
  var startPosition = params.shapeInfo.startPosition;

  params.shapeInfo.height = calculateDragHeight(startPosition);
  params.shapeInfo.width = calculateDragWidth(startPosition);

}

function calculateDragWidth(startPosition) {
  
  return stage.getPointerPosition().x - startPosition.x;
}

function calculateDragHeight(startPosition) {
  return stage.getPointerPosition().y - startPosition.y;
}

function removePrevious() {
  
  var shapeInfo = params.shapeInfo;

  if (shapeInfo.previousShape) {
    var prev = shapeInfo.previousShape;
    prev.destroy();
    stage.draw();
  }
}

//toolbar
function setCurrentTool(element) {
  var toolBar = setToolBar();
  params.currentTool = element.id;
  toolBar.forEach(function (tool) {
    if (tool === element) {
      tool.classList.add("btn-selected");
    } else {
      tool.classList.remove("btn-selected");
    }
  });
}

function defaultTool() {
  var select = document.getElementById("select");
  setCurrentTool(select);
}

function useTool(event) {
  switch (params.currentTool) {
    case "select":
      selectElement(event);
      break;
    case "delete":
      deleteElement(event);
      break;
    case "rect":
      drawRect(params.shapeInfo);
      break;
    case "circle":
      drawCircle(params.shapeInfo);
      break;
    default:
      break;
  }
  //defaultTool();
}

// tools methods
function selectElement(event) {
 
  var element = event.target;
  var background = stage.findOne("#background");

  if (element == background) {
    params.selected = "none";
  } else {
    params.selected = element;
  }
}

function deleteElement(event) {
 
  var element = event.target;
  var background = stage.findOne("#background");
  if (element != background) {
    element.destroy();
    stage.draw();
  }
}

function drawRect(shapeInfo) {
  
  var mainLayer = stage.findOne("#mainLayer");
  var shapeInfo = params.shapeInfo;

  shapeInfo.color = params.currentColor;

  var rect = new Konva.Rect({
    x: shapeInfo.startPosition.x,
    y: shapeInfo.startPosition.y,
    width: shapeInfo.width,
    height: shapeInfo.height,
    fill: shapeInfo.color,
    stroke: "black",
    strokeWidth: 4,
    name: "rect"
  });

  rect.addEventListener("mousedown", function (){
   if(params.currentTool !== "select"){
     this.draggable(false);
   }
   else{
     this.draggable(true);  
   }
 });


  mainLayer.add(rect);
  shapeInfo.previousShape = rect;
  
  stage.draw();
}


function drawCircle(shapeInfo) {
  
  var mainLayer = stage.findOne("#mainLayer");
  var shapeInfo = params.shapeInfo;

  shapeInfo.color = params.currentColor;

  var radius = Math.sqrt(
    Math.pow(shapeInfo.width, 2) + Math.pow(shapeInfo.height, 2)
  );

  var circle = new Konva.Circle({
    x: shapeInfo.startPosition.x,
    y: shapeInfo.startPosition.y,
    radius: radius,
    fill: shapeInfo.color,
    stroke: "black",
    strokeWidth: 4,
    name: "circle"
  });

  circle.addEventListener("mousedown", function (){
    if(params.currentTool !== "select"){
      this.draggable(false);
    }
    else{
      this.draggable(true);  
    }
  });
  mainLayer.add(circle);
  shapeInfo.previousShape = circle;
  
  stage.draw();
}

// helper methods

function getColor() {
  
  var color = colorArray[Math.floor(Math.random() * colorArray.length)];
  return color;
}

function logObject(object) {
  console.log(JSON.stringify(object));
}

//color

function setColorPalette(){
  var colorArray = ["red", "orange", "green", "blue", "yellow", "pink"];

  var colorPalette = document.getElementById("color-palette");

  colorArray.forEach(function(color){
    var colorButton = document.createElement("div");
    colorButton.id = color;
    colorButton.classList.add("color-btn");
    colorButton.style.backgroundColor = color;
    colorButton.addEventListener("click",function(event){
      setCurrentColor(this);
      
      if(params.selected !== "none"){
        params.selected.fill(params.currentColor);
      }
      
    });
    colorPalette.appendChild(colorButton);
  })

  var defaultColor = document.getElementById("red");
  
  defaultColor.classList.add("color-btn-selected");
}

function getColorPalette(){
 var colorPalette = Array.from(document.getElementById("color-palette").children);
  return colorPalette;
}

function setCurrentColor(element) {
  var colorPalette = getColorPalette();
  
  params.currentColor = element.id;
  colorPalette.forEach(function (color) {
    if (color === element) {
      color.classList.add("color-btn-selected");
    } else {
      color.classList.remove("color-btn-selected");
    }
  });
}