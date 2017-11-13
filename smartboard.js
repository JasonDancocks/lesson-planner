var params = initialize();

//testing

//next steps
//bug - shapes drawn when dragging
//backgwards drag draw rectangle
// refactor

//Initialise methods
function initialize() {
  var params = setParams();

  addBackground(params);
  addMainLayer(params);

  return params;
}

function setParams() {
  var params = {};

  params.shapeInfo = {};
  params.isMouseDragging = false;
  params.toolBar = setToolBar();
  params.currentTool = "select";
  params.selected = "none";
  params.stage = setStage();

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
  var width = params.stage.width();
  var height = params.stage.height();
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
  params.stage.add(backgroundLayer);
}

function addMainLayer(params) {
  var mainLayer = new Konva.Layer({
    id: "mainLayer"
  });
  params.stage.add(mainLayer);
}

// event handlers

// needs to be called on shape not stage
params.stage.on("mouseenter", function (event){
   var element = event.target;
  if(params.currentTool !== "select"){
    element.draggable(false);
  }
  else{
    element.draggable(true);  
  }
});

params.stage.on("mousedown touchstart", function () {
  getStartPosition();
  params.isMouseDragging = true;
});

params.stage.on("mousemove touchmove", function(event) {
  if (params.isMouseDragging) {
    setDragSize();
    removePrevious();
    useTool(event);
  }
});

params.stage.on("mouseup touchend", function (event) {
  params.isMouseDragging = false;
  params.shapeInfo = {};

  if (params.currentTool === "select" || params.currentTool === "delete") {
    useTool(event);
  }
});

//event helpers
function getStartPosition() {
  params.shapeInfo.startPosition = params.stage.getPointerPosition();
}

function setDragSize() {
  calculateDragWidth();
  calculateDragHeight();
}

function calculateDragWidth() {
  params.shapeInfo.width = Math.abs(params.stage.getPointerPosition().x - params.shapeInfo.startPosition.x);
}

function calculateDragHeight() {
  params.shapeInfo.height = Math.abs(params.stage.getPointerPosition().y - params.shapeInfo.startPosition.y);
}

function removePrevious() {
  var stage = params.stage;
  var shapeInfo = params.shapeInfo;

  if (shapeInfo.previousShape) {
    var prev = shapeInfo.previousShape;
    prev.destroy();
    stage.draw();
  }
}

//toolbar
function setCurrentTool(element) {
  params.currentTool = element.id;

  params.toolBar.forEach(function (tool) {
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
  var stage = params.stage;
  var element = event.target;
  var background = stage.findOne("#background");

  if (element == background) {
    params.selected = "none";
  } else {
    params.selected = element;
  }
}

function deleteElement(event) {
  var stage = params.stage;
  var element = event.target;
  var background = stage.findOne("#background");
  if (element != background) {
    element.destroy();
    stage.draw();
  }
}

function drawRect(shapeInfo) {
  var stage = params.stage;
  var mainLayer = stage.findOne("#mainLayer");
  var shapeInfo = params.shapeInfo;

  shapeInfo.color = getColor();

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
  mainLayer.add(rect);
  shapeInfo.previousShape = rect;
  stage.draw();
}

function drawCircle(shapeInfo) {
  var stage = params.stage;
  var mainLayer = stage.findOne("#mainLayer");
  var shapeInfo = params.shapeInfo;

  shapeInfo.color = getColor();

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
  mainLayer.add(circle);
  shapeInfo.previousShape = circle;
  stage.draw();
}

// helper methods

function getColor() {
  var colorArray = ["red", "orange", "green", "blue", "yellow", "pink"];
  var color = colorArray[Math.floor(Math.random() * colorArray.length)];
  return color;
}

function logObject(object) {
  console.log(JSON.stringify(object));
}