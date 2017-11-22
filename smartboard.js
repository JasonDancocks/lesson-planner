var stage = setStage();
var params = initialize();

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

function initialize() {
  var params = setParams();

  addBackground(params);
  addMainLayer(params);
  setToolBar();
  setZIndexBar();
  setColorPalette();
  return params;
}

function setParams() {
  var params = {};

  params.shapeInfo = {};
  params.isMouseDragging = false;
  params.currentTool = "select";
  params.currentColor = "red";
  params.selectGroup = [];

  return params;
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

function setToolBar() {
  var toolBar = Array.from(document.getElementById("buttons").children);

  toolBar.forEach(function (element) {
    element.addEventListener("click", function () {
      setCurrentTool(element);
    });
  });

  return toolBar;
}

function setZIndexBar() {
  var zIndexBar = Array.from(
    document.getElementById("zindex-buttons").children
  );

  zIndexBar.forEach(function (element) {
    element.addEventListener("click", function (event) {
      if (params.selectGroup.length > 0) {
        moveElement(element, event);
      }
    });
  });
}

function setColorPalette() {
  var colorArray = ["red", "orange", "green", "blue", "yellow", "pink"];
  var colorPalette = document.getElementById("color-palette");

  colorArray.forEach(function (color) {
    var colorButton = createColorButton(color);

    colorButton.addEventListener("click", function () {
      setCurrentColor(colorButton);
      changeColor();
    });

    colorPalette.appendChild(colorButton);
  });

  setDefaultColor(colorArray[0]);
}

function setDefaultColor(color) {
  var defaultColor = document.getElementById(color);

  defaultColor.classList.add("color-btn-selected");
}

function createColorButton(color) {
  var colorButton = document.createElement("div");

  colorButton.id = color;
  colorButton.classList.add("color-btn");
  colorButton.style.backgroundColor = color;

  return colorButton;
}

// event handlers
stage.on("mousedown touchstart", function () {
  getStartPosition();
  clearSelectGroup();
  params.isMouseDragging = true;
});

stage.on("mousemove touchmove", function (event) {
  if (params.isMouseDragging) {
    setDragSize();
    removePrevious();
    useTool(event);
  }
});

stage.on("mouseup touchend", function (event) {
  params.isMouseDragging = false;
  removePrevious();
  useTool(event);
  params.shapeInfo = {};
});

stage.on("dragstart", function () {
  removeHighlightBox();
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

// Toolbar methods
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
      drawShape();

      break;
    case "circle":
      drawShape();
      break;
    default:
      break;
  }
  if (params.currentTool !== "select" && event.type === "mouseup") {
    highlightSelected();
  }
  //defaultTool();
}

//Select methods
function selectElement(event) {
  var element = event.target;
  var background = stage.findOne("#background");

  removeHighlightBox();

  if (params.isMouseDragging === true) {
    if (event.type === "mousemove") {
      drawShape();
    }
    selectMultiple(background);
  } else {
    singleSelect(element, background);
  }

  highlightSelected();
}

function singleSelect(element, background) {
  if (element !== background && element !== stage) {
    params.selectGroup.push(element);
  }
}

function selectMultiple(background) {
  var searchArea = setSearchArea();
  var selection = [];

  for (var x = searchArea.start.x; x <= searchArea.end.x; x += 5) {
    for (var y = searchArea.start.y; y <= searchArea.end.y; y += 5) {
      var shape = stage.getIntersection({
        x: x,
        y: y
      });

      if (shape !== background && !params.selectGroup.includes(shape)) {
        selection.push(shape);
      }
      params.selectGroup = selection;
    }
  }
}

function setSearchArea() {
  var startPos = params.shapeInfo.startPosition;
  var endPos = stage.getPointerPosition();

  var searchArea = {
    start: {
      x: Math.min(Math.floor(startPos.x), Math.ceil(endPos.x)),
      y: Math.min(Math.floor(startPos.y), Math.ceil(endPos.y))
    },
    end: {
      x: Math.max(Math.floor(startPos.x), Math.ceil(endPos.x)),
      y: Math.max(Math.floor(startPos.y), Math.ceil(endPos.y))
    }
  };

  return searchArea;
}

function highlightSelected() {
  var mainLayer = stage.findOne("#mainLayer");

  params.selectGroup.forEach(function (element) {
    var selected = element;
    var selectRect = selected.getSelfRect();

    var x = selected.getAttr("x") + selectRect.x - 10;
    var y = selected.getAttr("y") + selectRect.y - 10;

    var rect = new Konva.Rect({
      x: x,
      y: y,
      width: selectRect.width + 20,
      height: selectRect.height + 20,
      fill: null,
      stroke: "black",
      strokeWidth: 2,
      dash: [5, 5],
      name: "highlightBox",
      listening: false
    });
    mainLayer.add(rect);
  });
  mainLayer.draw();
}

function removeHighlightBox() {
  var highlightBoxes = stage.find(".highlightBox");
  var mainLayer = stage.findOne("#mainLayer");

  highlightBoxes.forEach(function (box) {
    box.destroy();
  });

  mainLayer.draw();
}

function clearSelectGroup() {
  params.selectGroup = [];
  highlightSelected();
}


//Delete methods
function deleteElement(event) {
  var element = event.target;
  var background = stage.findOne("#background");
  var layer = element.getLayer();

  if (element != background) {
    element.destroy();
    removeHighlightBox();
  }
}

function removePrevious() {
  var shapeInfo = params.shapeInfo;

  if (shapeInfo.previousShape) {
    var prev = shapeInfo.previousShape;
    var layer = prev.getLayer();

    prev.destroy();
    layer.batchDraw();
  }
}
//Shape methods
function drawShape() {
  var mainLayer = stage.findOne("#mainLayer");
  var background = stage.findOne("#background");
  var shapeInfo = params.shapeInfo;
  var shape;

  shapeInfo.color = params.currentColor;

  switch (params.currentTool) {
    case "rect":
      shape = drawRect(shapeInfo);
      break;
    case "circle":
      shape = drawCircle(shapeInfo);
      break;
    case "select":
      shape = drawSelectBox(shapeInfo);
      break;
  }

  toggleDraggable(shape);

  mainLayer.add(shape);
  shapeInfo.previousShape = shape;

  mainLayer.batchDraw();

  if (params.currentTool !== "select") {
    params.selectGroup = [];
    params.selectGroup.push(shape);
  }
}

function drawSelectBox(shapeInfo) {
  var shape = drawRect(shapeInfo);

  shape.fill(null);
  shape.dash([10, 5]);
  shape.strokeWidth(2);
  shape.id("selectBox");
  shape.listening(false);
  return shape;
}

function drawRect(shapeInfo) {
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

  return rect;
}

function drawCircle(shapeInfo) {
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

  return circle;
}

//Color methods
function getColorPalette() {
  var colorPalette = Array.from(
    document.getElementById("color-palette").children
  );
  return colorPalette;
}

function changeColor() {
  var layer = stage.findOne("#mainLayer");

  params.selectGroup.forEach(function (element) {
    element.fill(params.currentColor);
  });

  layer.draw();

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
//Zindex methods

function moveElement(element, event) {
  var layer = stage.findOne("#mainLayer");

  switch (element.id) {
    case "move-to-back":
      params.selectGroup.forEach(function (element) {
        element.moveToBottom();
      });
      break;
    case "move-backward":
      params.selectGroup.forEach(function (element) {
        element.moveDown();
      });
      break;
    case "move-forward":
      params.selectGroup.forEach(function (element) {
        element.moveUp();
      });
      break;
    case "move-to-front":
      params.selectGroup.forEach(function (element) {
        element.moveToTop();
      });
      break;
  }
  layer.draw();
}

//helper methods
function toggleDraggable(element) {
  element.addEventListener("mouseenter", function () {
    if (params.currentTool !== "select") {
      this.draggable(false);
    } else {
      this.draggable(true);
    }
  });
}