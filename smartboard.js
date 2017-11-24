var state = setState();
var stage = setStage();
initialize();

/*
Initialize methods - ran once
*/
function setState() {
  var state = {
    startPosition: {},
    isMouseDragging: false,
    selectGroup: [],
    currentTool: "select",
    currentColor: null,
    buttonsObject: {
      tool: ["select", "rect", "circle", "delete"],
      color: ["red", "orange", "yellow", "green", "blue", "indigo", "violet"],
      zindex: ["back", "backward", "forward", "front"],
    }
  }
  return state;
}

function setStage() {
  var stage = new Konva.Stage({
    container: "canvas-container",
    width: 500,
    height: 500,
    id: "canvas"
  });

  stage.on("mousedown touchstart", function (event) {
    stageMouseDown(event);
  });
  stage.on("mousemove touchmove", function (event) {
    stageMouseMove(event);
  });
  stage.on("mouseup touchend", function (event) {
    stageMouseUp(event);
  });

  return stage;
}

function initialize() {
  addBackground();
  addMainLayer();
  setButtons();
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

function setButtons() {
  for (type in state.buttonsObject) {
    var buttonBar = createButtonBar(type);
    var buttonArray = state.buttonsObject[type];
    buttonArray.forEach(function (button) {
      var button = createButton(button, type);
      addButtonClick(button, type);
      buttonBar.appendChild(button);
    });
  }
}

function createButtonBar(type) {
  var toolPanel = document.getElementById("tool-panel");
  var bar = document.createElement("div");

  bar.id = type + "bar";
  bar.classList.add("buttons");

  toolPanel.appendChild(bar);
  return bar;
}

function createButton(id, type) {
  var button = document.createElement("div");
  button.id = id;
  button.classList.add("btn");

  if (type === "color") {
    button.style.backgroundColor = id;
  } else {
    button.innerHTML = id;
  }
  return button;
}

function addButtonClick(button, type) {
  if (type === "zindex") {
    button.addEventListener("click", function () {
      moveButtonClick(this);
    });
  } else if (type === "tool") {
    if (button.id === "delete") {
      button.addEventListener("click", function () {
        deleteElement();
      })
    } else {
      button.addEventListener("click", function () {
        toolButtonClick(this);
      });
    }
  } else if (type === "color") {
    button.addEventListener("click", function () {
      colorButtonClick(this);
    });
  }
}
/*
  Event handler methods
*/
function stageMouseDown(event) {
  state.startPosition = stage.getPointerPosition();
  if (!event.evt.ctrlKey) {
    clearSelectGroup();
  }
  state.isMouseDragging = true;
}

function stageMouseMove(event) {
  if (state.isMouseDragging) {
    useTool(event);
  }
}

function stageMouseUp(event) {
  state.isMouseDragging = false;
  useTool(event);
  state.previousShape = undefined;
}

function moveButtonClick(button) {
  if (state.selectGroup.length > 0) {
    moveElement(button);
  }
}

function colorButtonClick(button) {
  setCurrent(button);
  changeColor();
}

function toolButtonClick(button) {
  setCurrent(button);
}
/*
Set current state methods
*/
function setCurrent(selectedButton) {
  for (type in state.buttonsObject) {
    if (state.buttonsObject[type].includes(selectedButton.id)) {
      if (type === "tool") {
        state.currentTool = selectedButton.id;
      } else if (type === "color") {
        state.currentColor = selectedButton.id;
      }
      toggleCurrentHighlight(type, selectedButton);
    }
  }
}

function toggleCurrentHighlight(type, selectedButton) {
  var buttonBar = getButtonBar(type);
  buttonBar.forEach(function (button) {
    if (button.id === selectedButton.id) {
      button.classList.add("btn-selected");
    } else {
      button.classList.remove("btn-selected");
    }
  });
}

function getButtonBar(type) {
  var barId = type + "bar";
  var buttonBar = Array.from(document.getElementById(barId).children);
  return buttonBar;
}

/* 
Tool methods
*/
function useTool(event) {
  var currentTool = state.currentTool;
  removePrevious();

  switch (currentTool) {
    case "select":
      selectElement(event);
      break;
    case "rect":
      drawShape();
      break;
    case "circle":
      drawShape();
      break;
  }
  if (currentTool !== "select" && event.type === "mouseup") {
    highlightSelected();
  }
  //defaultTool();
}

//Tool helpers
function clearSelectGroup() {
  state.selectGroup = [];
  removeHighlight();
}

function removePrevious() {
  if (state.previousShape) {
    var prev = state.previousShape;
    var layer = prev.getLayer();

    prev.destroy();
    layer.batchDraw();
    state.previousShape = undefined;
  }
}

/* 
Select methods
*/
function selectElement(event) {
  var element = event.target;
  var background = stage.findOne("#background");

  if (state.isMouseDragging === true) {
    if (event.type === "mousemove") {
      drawSelectBox();
    }
    selectMultiple(background);
  } else {
    singleSelect(element, background);
  }
  highlightSelected();
}

function singleSelect(element, background) {
  if (element !== background && element !== stage) {
    state.selectGroup.push(element.getParent());
  }
}

function selectMultiple(background) {
  var searchArea = setSearchArea();
  var selection = [];
  var shape;
  for (var x = searchArea.start.x; x <= searchArea.end.x; x += 5) {
    for (var y = searchArea.start.y; y <= searchArea.end.y; y += 5) {
      shape = stage.getIntersection({
        x: x,
        y: y
      });
      if (shape !== background && !state.selectGroup.includes(shape.getParent())) {
        selection.push(shape.getParent());
      }
      state.selectGroup = selection;
    }
  }
}

//select helpers
function drawSelectBox() {
  var shapeInfo = getShapeInfo();
  var layer = stage.findOne("#mainLayer");

  var shape = new Konva.Rect({
    x: shapeInfo.startPosition.x,
    y: shapeInfo.startPosition.y,
    width: shapeInfo.width,
    height: shapeInfo.height,
    fill: null,
    stroke: "black",
    strokeWidth: 2,
    dash: [10, 5],
    id: "selectBox",
    listening: false
  });

  layer.add(shape);
  state.previousShape = shape;
}

function toggleDraggable(element) {
  element.addEventListener("mouseenter", function () {
    if (state.currentTool !== "select") {
      this.draggable(false);
    } else {
      this.draggable(true);
    }
  });
}

function setSearchArea() {
  var startPos = state.startPosition;
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

/*
Select Highlighting
*/
function highlightSelected() {
  var layer = stage.findOne("#mainLayer");
  var highlightElements;

  removeHighlight();
  state.selectGroup.forEach(function (group) {
    highlightElements = group.find(".highlightBox, .resize");
    highlightElements.forEach(function (element) {
      element.visible(true);
    });
  });

  layer.draw();
}

function removeHighlight() {
  var highlightElements = stage.find(".highlightBox, .resize");
  highlightElements.forEach(function (element) {
    element.visible(false);
  });
}

// create highlight elements
function createHighlightGroup(element) {
  var highlightBox = createHighlightBox(element);
  var resize = createResizeButton(highlightBox);
  var groupPos = getGroupPos(element);
  var group = new Konva.Group({
    x: groupPos.x,
    y: groupPos.y,
    name: "selected"
  });

  group.add(highlightBox);
  group.add(element);
  group.add(resize);

  toggleDraggable(group);

  return group;
}
// create helpers
function createHighlightBox(element) {
  var selectRect = element.getSelfRect();
  var x = element.getAttr("x") + selectRect.x - 10;
  var y = element.getAttr("y") + selectRect.y - 10;

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

  return rect;
}

function createResizeButton(highlightBox) {
  var resizePos = {
    x: highlightBox.x() + highlightBox.width(),
    y: highlightBox.y() + highlightBox.height(),
  }

  var resize = new Konva.Circle({
    x: resizePos.x,
    y: resizePos.y,
    radius: 5,
    fill: "grey",
    stroke: "black",
    strokeWidth: 2,
    name: "resize",
  });

  return resize;
}

function getGroupPos(element) {
  var groupPos = {
    x: element.getSelfRect().x,
    y: element.getSelfRect().y
  };
  if (element.name() === "circle") {
    groupPos.x += element.radius();
    groupPos.y += element.radius();
  }
  return groupPos;
}

/*
Delete methods
*/
function deleteElement() {
  var layer = stage.findOne("#mainLayer");

  state.selectGroup.forEach(function (shapeGroup) {
    shapeGroup.destroy();
  });
  clearSelectGroup();
  layer.draw();
}

/*
Shape methods
*/
function drawShape() {
  var layer = stage.findOne("#mainLayer");
  var shapeInfo = getShapeInfo();
  var shape;
  var group;

  switch (state.currentTool) {
    case "rect":
      shape = drawRect(shapeInfo);
      break;
    case "circle":
      shape = drawCircle(shapeInfo);
      break;
  }

  group = createHighlightGroup(shape);
  layer.add(group);
  state.previousShape = group;

  layer.batchDraw();

  clearSelectGroup();
  state.selectGroup.push(group);
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
  var circle = new Konva.Circle({
    x: shapeInfo.startPosition.x,
    y: shapeInfo.startPosition.y,
    radius: calculateRadius(shapeInfo),
    fill: shapeInfo.color,
    stroke: "black",
    strokeWidth: 4,
    name: "circle"
  });
  return circle;
}

//shape helpers
function getShapeInfo() {
  var shapeInfo = {
    startPosition: state.startPosition,
    width: calculateDragWidth(),
    height: calculateDragHeight(),
    color: state.currentColor
  }
  return shapeInfo;
}

function calculateRadius(shapeInfo) {
  return Math.sqrt(
    Math.pow(shapeInfo.width, 2) + Math.pow(shapeInfo.height, 2)
  );
}

function calculateDragWidth() {
  return stage.getPointerPosition().x - state.startPosition.x;
}

function calculateDragHeight() {
  return stage.getPointerPosition().y - state.startPosition.y;
}

/*
Color methods
*/
function changeColor() {
  var layer = stage.findOne("#mainLayer");
  var color = state.currentColor;
  state.selectGroup.forEach(function (shapeGroup) {
    var shape = shapeGroup.getChildren(function (node) {
      return node.name() !== "highlightBox" && node.name() !== "resize";
    });
    shape.fill(color);
  });
  layer.draw();
}

//Zindex methods

function moveElement(button) {
  var layer = stage.findOne("#mainLayer");
  state.selectGroup.forEach(function (element) {
    switch (button.id) {
      case "back":
        element.moveToBottom();
        break;
      case "backward":
        element.moveDown();
        break;
      case "forward":
        element.moveUp();
        break;
      case "front":
        element.moveToTop();
        break;
    }
  });
  layer.draw();
}