var state = setState();
var stage = setStage();
initialize();

/*
  Bugs :
    Resize circle needs fixing  - circle expands to meet pointer on resize.
*/
/*
Initialize methods - ran once
*/
function setState() {
  var state = {
    selectGroup: [],
    currentTool: "select",
    currentColor: null,
    buttonsObject: {
      tool: ["select", "rect", "circle", "delete"],
      color: ["red", "orange", "yellow", "green", "blue", "indigo", "violet"],
      zindex: ["back", "backward", "forward", "front"],
    },
    currentShape: undefined,
    isEditing: false,
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
  if (id === "select") {
    button.classList.add("btn-selected");
  }
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
function setResizeDragBounds(resize) {
  var shape = getShapeFromShapeGroup(state.currentShape);

  resize.dragBoundFunc(function (pos) {
    var x = Math.max(pos.x, shape.x());
    var y = Math.max(pos.y, shape.y());

    return {
      x: x,
      y: y,
    }
  });
}

function setRotateDragBounds(rotate) {
  var shape = getShapeFromShapeGroup(state.currentShape);

  rotate.dragBoundFunc(function (pos) {
    //get centre point
    var x = shape.x();
    var y = shape.y();
    var radius = shape.height() / 2 + 25;
    var scale = radius / Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
    //check if anchor is on circle
    if (scale === 1) {
      return pos;
    } else {
      return {
        y: Math.round((pos.y - y) * scale + y),
        x: Math.round((pos.x - x) * scale + x)
      };
    }

  });
}

function prepareShapeForEdit(target) {
  var shapeGroup = target.getParent();
  shapeGroup.draggable(false);
  state.currentShape = shapeGroup;
  state.isEditing = true;
}

function endShapeEdit(target) {
  var shapeGroup = target.getParent();
  shapeGroup.draggable(true);
  state.currentShape = undefined;
  state.isEditing = false;
  stage.listening(true);
}

function rotateMousedown(target) {
  var shapeGroup = target.getParent();
  var layer = shapeGroup.getLayer();
  var shape = getShapeFromShapeGroup(shapeGroup);
  var highlightBox = shapeGroup.findOne(".highlightBox");
  var elementsToRotate = [shape, highlightBox];
  var newX,
    newY,
    offsetX,
    offsetY;

  prepareShapeForEdit(target);
  setRotateDragBounds(target);
  elementsToRotate.forEach(function (shape) {
    if (shape.getClassName() === "Rect" && shape.offsetX() === 0) {
      offsetX = shape.width() / 2;
      offsetY = shape.height() / 2;

      newX = shape.x() + offsetX;
      newY = shape.y() + offsetY;

      shape.x(newX);
      shape.y(newY);

      shape.offsetX(shape.width() / 2);
      shape.offsetY(shape.height() / 2);

    }
  });
  state.rotateStartPos = stage.getPointerPosition();

}

function rotateDragstart() {
  stage.listening(false);
}

function calculateRotationAngle(target, shape) {
  var radius = shape.height() / 2 + 25;
  var startPosX = state.rotateStartPos.x;
  var startPosY = state.rotateStartPos.y;
  var currentX = target.x();
  var currentY = target.y();
  var directionModifier;
  if (currentX > startPosX) {
    directionModifier = 1;
  } else {
    directionModifier = -1;
  }
  var distanceBetweenPoints2 = Math.pow(currentX - startPosX, 2) + Math.pow(currentY - startPosY, 2);
  var radius2 = Math.pow(radius, 2);
  //cosine rule
  var numerator = 2 * radius2 - distanceBetweenPoints2;
  var denominator = 2 * radius2;
  var quotient = numerator / denominator;
  quotient = Math.max(quotient, -1);
  var angle = Math.acos(quotient);
  var angleInDegrees = directionModifier * angle * 180 / Math.PI;

  return angleInDegrees;

}

function rotateDragmove(target) {
  var shapeGroup = target.getParent();
  var layer = shapeGroup.getLayer();
  var shape = getShapeFromShapeGroup(shapeGroup);
  var highlightBox = shapeGroup.findOne(".highlightBox");
  var angle = calculateRotationAngle(target, shape);

  shape.rotation(angle);
  highlightBox.rotation(angle);
  layer.draw();
}

function rotateDragend(target) {
  var shape = getShapeFromShapeGroup(state.currentShape);

  if (shape.getClassName() === "Rect") {
    var newX = shape.x() - shape.offsetX();
    var newY = shape.y() - shape.offsetY();
  }
  endShapeEdit(target);
}

function resizeMousedown(target) {
  prepareShapeForEdit(target);
  setResizeDragBounds(target);
}

function resizeDragmove(target) {
  var position = target.position();
  updateShape(position);
}

function resizeDragstart() {
  stage.listening(false);
}

function resizeDragend(target) {
  endShapeEdit(target);
}

function stageMouseDown(event) {
  var target = event.target;
  if (target.name() === "resize") {
    resizeMousedown(target);
  } else if (target.name() === "rotate") {
    rotateMousedown(target);
  } else {
    var startPos = stage.getPointerPosition();
    drawShape(startPos);
    if (!event.evt.ctrlKey) {
      clearSelectGroup();
    }
  }
}

function stageMouseMove(event) {

  if (state.currentShape && !state.isEditing) {
    var position = stage.getPointerPosition();
    updateShape(position);
    if (state.currentTool === "select") {
      select(event);
    }
  }
}


function stageMouseUp(event) {
  if (state.currentTool === "select" && event.target.name() !== "resize" && event.target.name() !== "rotate") {
    select(event);
    removeSelectBox();
  }
  state.currentShape = undefined;
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
      toggleButtonHighlight(type, selectedButton);
    }
  }
}
//set current helpers
function toggleButtonHighlight(type, selectedButton) {
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
Select methods
*/
function select(event) {
  var background = stage.findOne("#background");
  var element = event.target;
  if (event.type === "mousemove") {
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
function removeSelectBox() {
  var shape = state.currentShape;
  var layer = shape.getLayer();

  shape.destroy();
  layer.draw();
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
  var shape = getShapeFromShapeGroup(state.currentShape);
  var startPos = shape.position();
  var endPos = {
    x: startPos.x + shape.width(),
    y: startPos.y + shape.height(),
  };

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
    highlightElements = group.find(".highlightBox, .resize, .rotate");
    highlightElements.forEach(function (element) {
      element.visible(true);
    });
  });

  layer.draw();
}

function removeHighlight() {
  var highlightElements = stage.find(".highlightBox, .resize, .rotate");
  highlightElements.forEach(function (element) {
    element.visible(false);
  });
}

// create highlight elements
function createHighlightGroup(element) {
  var highlightBox = createHighlightBox(element);
  var resize = createResizeButton();
  var rotate = createRotateButton();
  var groupPos = getGroupPos(element);
  var group = new Konva.Group({
    x: groupPos.x,
    y: groupPos.y,
    name: "selected"
  });

  group.add(element);

  if (state.currentTool !== "select") {
    group.add(highlightBox);
    group.add(resize);
    group.add(rotate);
    toggleDraggable(group);
  }
  return group;
}
// create helpers
function createHighlightBox(element) {
  var rect = new Konva.Rect({
    fill: null,
    stroke: "black",
    strokeWidth: 2,
    dash: [5, 5],
    name: "highlightBox",
    listening: false
  });

  return rect;
}

function createResizeButton() {
  var resize = new Konva.Circle({
    radius: 5,
    fill: "grey",
    stroke: "black",
    strokeWidth: 2,
    name: "resize",
    draggable: true,
  });
  resize.addEventListener("dragstart", function () {
    resizeDragstart();
  });
  resize.addEventListener("dragmove", function () {
    resizeDragmove(this);
  });
  resize.addEventListener("dragend", function () {
    resizeDragend(this);
  });

  return resize;
}

function createRotateButton() {
  var rotate = new Konva.Circle({
    radius: 5,
    fill: "green",
    stroke: "black",
    strokeWidth: 2,
    name: "rotate",
    draggable: true,
  });

  rotate.addEventListener("dragstart", function () {
    rotateDragstart();
  });
  rotate.addEventListener("dragmove", function () {
    rotateDragmove(this);
  });
  rotate.addEventListener("dragend", function () {
    rotateDragend(this);
  });
  return rotate;
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
Shape Drawing  methods
*/
function drawShape(startPos) {
  var layer = stage.findOne("#mainLayer");
  var shape;
  var group;

  switch (state.currentTool) {
    case "select":
      shape = drawSelectBox();
      break;
    case "rect":
      shape = drawRect();
      break;
    case "circle":
      shape = drawCircle();
      break;
  }

  shape.position(startPos);
  group = createHighlightGroup(shape);

  updateStateCurrentShape(layer, group);
}

function drawSelectBox() {
  var shape = new Konva.Rect({
    fill: null,
    stroke: "black",
    strokeWidth: 2,
    dash: [10, 5],
    id: "selectBox",
    listening: false
  });
  return shape;
}

function drawRect() {
  var rect = new Konva.Rect({
    fill: state.currentColor,
    stroke: "black",
    strokeWidth: 4,
    name: "rect"
  });
  return rect;
}

function drawCircle() {
  var circle = new Konva.Circle({
    fill: state.currentColor,
    stroke: "black",
    strokeWidth: 4,
    name: "circle"
  });
  return circle;
}

//shape helpers

function calculateRadius(width, height) {
  return Math.sqrt(
    Math.pow(width, 2) + Math.pow(height, 2)
  );
}

function updateStateCurrentShape(layer, shape) {
  layer.add(shape);
  state.currentShape = shape;
}

// update shape methods
function updateShape(position) {
  var shapeObject = getCurrentShape();
  var layer = shapeObject.shape.getLayer();

  setShapeSize(position, shapeObject.shape);

  if (shapeObject.highlightBox) {
    updateHighlightElements(shapeObject);
  }
  layer.batchDraw();
}

function getCurrentShape() {
  var shape = getShapeFromShapeGroup(state.currentShape);
  var highlightBox = state.currentShape.findOne(".highlightBox");
  var resize = state.currentShape.findOne(".resize");
  var rotate = state.currentShape.findOne(".rotate");
  return {
    shape: shape,
    highlightBox: highlightBox,
    resize: resize,
    rotate: rotate,
  }
}

function setShapeSize(position, shape) {
  var width = position.x - shape.x();
  var height = position.y - shape.y();

  if (shape.getClassName() === "Circle") {
    var radius = calculateRadius(width, height);
    shape.radius(radius);
  } else {
    shape.width(width);
    shape.height(height);
  }
}

function updateHighlightElements(shapeObject) {
  var shape = shapeObject.shape;
  var highlightBox = shapeObject.highlightBox;
  var resize = shapeObject.resize;
  var rotate = shapeObject.rotate;

  updateHighlightBox(shape, highlightBox);
  updateResizeAnchor(highlightBox, resize);
  updateRotateAnchor(shape, rotate);
}

function updateHighlightBox(shape, highlightBox) {
  var selectRect = shape.getSelfRect();
  var highlightBoxWidth = selectRect.width + 20;
  var highlightBoxHeight = selectRect.height + 20;
  var highlightBoxPosition = {
    x: shape.x() + selectRect.x - 10,
    y: shape.y() + selectRect.y - 10,
  };

  highlightBox.width(highlightBoxWidth);
  highlightBox.height(highlightBoxHeight);
  highlightBox.position(highlightBoxPosition);
}

function updateResizeAnchor(highlightBox, resize) {
  var resizePos = {
    x: highlightBox.x() + highlightBox.width(),
    y: highlightBox.y() + highlightBox.height(),
  }
  resize.position(resizePos);
}

function updateRotateAnchor(shape, rotate) {
  var rotatePos;
  if (shape.getClassName() === "Circle") {
    rotatePos = {
      x: shape.x(),
      y: shape.y() - shape.radius() - 25,

    }
  } else {
    rotatePos = {
      x: shape.x() + (shape.width() / 2),
      y: shape.y() - 25,
    }
  }
  rotate.position(rotatePos);
}

//Tool helpers
function clearSelectGroup() {
  state.selectGroup = [];
  removeHighlight();
}

function getShapeFromShapeGroup(shapeGroup) {
  return shapeGroup.getChildren(function (node) {
    return node.name() !== "highlightBox" && node.name() !== "resize" && node.name() !== "rotate";
  })[0];
}

function getHighlightBoxFromShape(shape) {
  var shapeGroup = shape.getParent();
  return shapeGroup.findOne(".highlightBox");
}
/*
Color methods
*/
function changeColor() {
  var layer = stage.findOne("#mainLayer");
  var color = state.currentColor;
  state.selectGroup.forEach(function (shapeGroup) {
    var shape = getShapeFromShapeGroup(shapeGroup);
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