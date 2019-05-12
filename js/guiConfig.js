"use strict";

var GuiConfig = GuiConfig || {};

GuiConfig.meshFileNames = [
  "cube.obj",
  "cow.obj",
  "horse.obj",
  "house.obj",
  "houseF.obj",
  "Cartoon Trees.obj",
  "tree1.obj",
  "tree2.obj",
  "tree3.obj",
  "LowPoly Cartoon Houses Pack02.obj"
];

// GuiConfig.resolutionOptions = ["320x240", "640x480", "800x600"];
GuiConfig.shaderOptions = ["Wire", "Flat", "Toon", "Pen and Ink"];
GuiConfig.reflectionModelOptions = ["Diffuse", "Phong"];

GuiConfig.controlDefs = [
  {
    name: "Push Mesh",
    type: "button",
    defaultVal: Gui.pushMesh,
    isButton: true,
  },

  {
    name: "Shading Model",
    type: "dropdown",
    defaultVal: GuiConfig.shaderOptions[0],
    dropdownOptions: GuiConfig.shaderOptions,
  },

  {
    name: "Ambient",
    type: "color",
    defaultVal: [0, 0, 0],
    isColor: true,
  },

  {
    name: "Diffuse",
    type: "color",
    defaultVal: [255, 255, 255],
    isColor: true,
  },

  {
    name: "Specular",
    type: "color",
    defaultVal: [255, 255, 255],
    isColor: true,
  },

  {
    name: "Shininess",
    type: "slider",
    sliderRange: [0, 20],
    defaultVal: 5,
  },
];
