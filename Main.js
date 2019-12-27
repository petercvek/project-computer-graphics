import Application from "./common/Application.js";
import * as WebGL from "./WebGL.js";

import Node from "./Node.js";

import shaders from "./shaders.js";
import * as CubeModel from "./cube.js";

import GLTFLoader from "./GLTFLoader.js";
import Renderer from "./Renderer.js";

const mat4 = glMatrix.mat4;

let pozicijaX = 1; // min 0
let pozicijaY = 1.5; // max 10, 5 sredina
let pozicijaZ = 0;
let premikam = false;
let smerFigure = 3.14159265;

function round(value, decimals) {
  return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

function premik(smer, usmerjenost) {
  var time = 0;
  var interval = setInterval(function() {
    if (time < 50) {
      if (smer === "x") {
        if (usmerjenost === "+") {
          pozicijaX = round(pozicijaX + 0.01, 3);
        } else {
          pozicijaX = round(pozicijaX - 0.01, 3);
        }
      } else {
        if (usmerjenost === "+") {
          pozicijaY = round(pozicijaY + 0.01, 3);
        } else {
          pozicijaY = round(pozicijaY - 0.01, 3);
        }
      }
      if (time > 24) {
        pozicijaZ = round(pozicijaZ - 0.02, 3);
      } else {
        pozicijaZ = round(pozicijaZ + 0.02, 3);
      }
      time++;
    } else {
      clearInterval(interval);
      premikam = false;
    }
  }, 2);
}

const keydownHandler = e => {
  if (premikam) {
    return 0;
  } else {
    premikam = true;
    if (e.code === "KeyW") {
      premik("x", "+");
      smerFigure = 3.14159265;
    } else if (e.code === "KeyS") {
      premik("x", "-");
      smerFigure = 0;
    } else if (e.code === "KeyD") {
      premik("y", "+");
      smerFigure = -1.57079;
    } else if (e.code === "KeyA") {
      premik("y", "-");
      smerFigure = 1.57079;
    }
  }
  console.log("X: " + pozicijaX, "Y: " + pozicijaY);
};
const keyupHandler = e => {
  //   console.log(e);
};

// dodaj listenerje ce klikns na tipke
document.addEventListener("keydown", keydownHandler);
document.addEventListener("keyup", keyupHandler);

class App extends Application {
  nastaviKamero = true;
  vseSceneVIgri = [];
  nalozeno = false;

  initGL() {
    const gl = this.gl;

    gl.clearColor(1, 1, 1, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    this.programs = WebGL.buildPrograms(gl, shaders);
  }

  start() {
    const gl = this.gl;

    this.initGL();

    const generirajSvet = async () => {
      for (let i = 0; i < 30; i++) {
        let loader2 = new GLTFLoader(this.gl);
        let gltf = await loader2.load("modeli/grass/grass.gltf");
        let t = gltf.nodes[2].transform;
        mat4.fromTranslation(t, [3, 0, 8 - i]);
        mat4.rotateX(t, t, 1.570796);
        this.vseSceneVIgri.push(gltf.scenes[0].nodes[1]);
      }

      let trees = [
        [1, 0, 0, 0, 1, 0, 1, 0, 1],
        [0, 0, 1, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 1, 1],
        [0, 1, 1, 0, 0, 0, 1, 0, 0]
      ];

      let differentTrees = ["tree0.gltf", "tree1.gltf", "tree2.gltf", "tree3.gltf"];
      for (let i = 0; i < trees.length; i++) {
        for (let j = 0; j < trees[i].length; j++) {
          if (trees[i][j] == 1) {
            let loader = new GLTFLoader(this.gl);
            let gltf = await loader.load("modeli/tree/" + differentTrees[Math.floor(Math.random() * differentTrees.length)]);
            // let gltf = await loader.load("modeli/tree/tree0.gltf");
            let t = gltf.nodes[2].transform;
            mat4.fromTranslation(t, [j - 1, 0.5, -i + 2]);
            mat4.rotateX(t, t, 1.570796);
            this.vseSceneVIgri.push(gltf.scenes[0].nodes[1]);
          }
        }
      }

      let loader = new GLTFLoader(this.gl);
      let gltf = await loader.load("modeli/vampire/vampire.gltf");
      this.hero = gltf;
      this.vseSceneVIgri.push(gltf.scenes[0].nodes[1]);
      this.nalozeno = true;
    };

    generirajSvet();
  }

  update() {
    // PREMIKANJE IN ROTIRANJE
    if (this.hero) {
      let s1 = this.hero;
      if (s1.nodes[2].transform) {
        let t2 = s1.nodes[2].transform;
        mat4.fromTranslation(t2, [2 * pozicijaY, pozicijaZ + 0.5, -2 * pozicijaX]);
        mat4.rotateX(t2, t2, 1.570796);
        mat4.rotateZ(t2, t2, smerFigure);
      }

      this.hero.nodes[0].parent.translation[0] += 0.1;
      // console.log(camera);

      // mat4.translate(camera, camera, [0, -0.1, 0]);
    }
  }

  render() {
    this.renderer = new Renderer(this.gl);

    if (!this.nalozeno) {
      return;
    }

    let camera = this.hero.nodes[0];
    if (this.nastaviKamero == true) {
      // nastavi kamero samo enkrat enkrat
      let t4 = camera.transform;
      mat4.rotateX(t4, t4, -0.2);
      this.nastaviKamero = false;
    }

    // Vse node zruzimo v eno sceno
    let vseScene = {
      name: "Scene",
      nodes: this.vseSceneVIgri
    };

    this.renderer.render(vseScene, camera);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector("canvas");
  new App(canvas);
});
