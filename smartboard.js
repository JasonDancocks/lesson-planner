var colorArray = ["red", "orange", "green", "blue", "yellow"];
var currentTool;
var selected = "default";

var toolBar = setToolBar();

var stage = setStage();

var mainLayer = new Konva.Layer();

var background = addBackground();

stage.add(mainLayer);

stage.on("click", function(event) {
  useTool(event);
});


//testing





//Initialise methods
function setStage() {
  var stage = new Konva.Stage({
    container: "canvas-container",
    width: 500,
    height: 500,
    id: "canvas"
  });

  return stage;
}

function addBackground() {
  var width = stage.width();
  var height = stage.height();
  var backgroundLayer = new Konva.Layer();
  var background = new Konva.Rect({
    x: 0,
    y: 0,
    width: width,
    height: height,
    fill: "white"
  });
  backgroundLayer.add(background);
  stage.add(backgroundLayer);
  
  return background;
}

//toolbar

function setToolBar() {
  var toolBar = Array.from(document.getElementById("buttons").children);
  toolBar.forEach(function(element) {
    element.addEventListener("click", function() {
      setCurrentTool(element);
    });
  });
  return toolBar;
}

function setCurrentTool(element) {
  var id = element.id;
  currentTool = id;
  toolBar.forEach(function(tool) {
    if (tool == element) {
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
  var mousePos = getMousePosition();
  var x = mousePos.x;
  var y = mousePos.y;
  
  switch (currentTool) {
    case "select":
      selectElement(event);
      break;
    case "delete":
      deleteElement(event);
      break;
    case "rect":
      drawRect(x, y);
      break;
    case "circle":
      drawCircle(x, y);
      break;
    default:
      break;
  }
  defaultTool();
}

// tools methods

function selectElement(event) {
  var element = event.target;
  if (element == background) {
    selected = "none";
  } else {
    selected = element;
  }
}

function deleteElement(event) {
  var element = event.target;
  if (element != background) {
    element.destroy();
    stage.draw();
  }
}

function drawRect(x, y) {
  var rect = new Konva.Rect({
    x: x,
    y: y,
    width: Math.floor(Math.random() * 500 + 1),
    height: Math.floor(Math.random() * 500 + 1),
    fill: getColor(),
    stroke: "black",
    strokeWidth: 4,
    draggable: true,
    name: "rect"
  });
  mainLayer.add(rect);
  stage.add(mainLayer);
}

function drawCircle(x, y) {
  var circle = new Konva.Circle({
    x: x,
    y: y,
    radius: 70,
    fill: getColor(),
    stroke: "black",
    strokeWidth: 4,
    name: "circle"
  });
  mainLayer.add(circle);
  stage.add(mainLayer);
}

// helper methods

function getColor() {
  var color = colorArray[Math.floor(Math.random() * colorArray.length - 1)];
  return color;
}

function getMousePosition() {
  var mousePosition = stage.getPointerPosition();
  return mousePosition;
}

