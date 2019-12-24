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

// function zavrti(usmerjenost) {
//   let smer = Math.abs(smerFigure % 6.283);
//   console.log("Smer:", smer);

//   let razlika = Math.abs(smer - usmerjenost);
//   // console.log(razlika);

//   if (razlika < 0.5) {
//     return;
//   }
//   if (razlika > 4.5) {
//     zavrtiZa(-1.57079);
//     return;
//   }
//   if (razlika > 3) {
//     zavrtiZa(3.14159265);
//     return;
//   }
//   if (razlika > 1) {
//     zavrtiZa(1.57079);
//     return;
//   }
// }

function zavrti(usmerjenost) {
  let time = 0;
  let smer = Math.abs(smerFigure % 6.283);
  let razlika = Math.abs(smer - usmerjenost);
  let majhenKot = razlika / 50;

  let interval = setInterval(function() {
    if (time < 50) {
      smerFigure = round(smerFigure + majhenKot, 7);
      time++;
    } else {
      clearInterval(interval);
      premikam = false;
    }
  }, 2);
}

function zavrtiZa(kot) {
  let time = 0;
  let majhenKot = kot / 50;

  let interval = setInterval(function() {
    if (time < 50) {
      smerFigure = round(smerFigure + majhenKot, 7);
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
      zavrti(3.14159265);
      // smerFigure = 3.14159265;
    } else if (e.code === "KeyS") {
      premik("x", "-");
      zavrti(0);
      // smerFigure = 0;
    } else if (e.code === "KeyD") {
      premik("y", "+");
      if (Math.abs(smerFigure % 6.283) > 3.14) {
        zavrti(4.71238265);
      } else {
        zavrti(-1.57079);
      }
      // smerFigure = -1.57079;
    } else if (e.code === "KeyA") {
      premik("y", "-");
      zavrti(1.57079);
      // smerFigure = 1.57079;
    }
  }
  // console.log("X: " + pozicijaX, "Y: " + pozicijaY);
};
const keyupHandler = e => {
  //   console.log(e);
};

// dodaj listenerje ce klikns na tipke
document.addEventListener("keydown", keydownHandler);
document.addEventListener("keyup", keyupHandler);

class App extends Application {
  nastaviKamero = true;
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
    this.renderer = new Renderer(this.gl);

    // We need a root node to add all other nodes to it.
    this.root = new Node();

    // The camera holds a projection transformation, and its global
    // transformation is used as the inverse view transformation.
    // this.camera = new Node();
    // this.camera.projection = mat4.create();
    // this.root.addChild(this.camera);

    // Dodaj modele

    this.loader = new GLTFLoader(this.gl);
    // Load GLTF
    this.loader.load("modeli/pingvin/pingvin2.gltf");

    this.pingvin = new Node();
    this.pingvin.model = this.loader;
    this.root.addChild(this.pingvin);

    this.loader2 = new GLTFLoader(this.gl);
    this.loader2.load("modeli/pingvin/pingvin2.gltf");
    this.pingvin2 = new Node();
    this.pingvin2.model = this.loader2;
    this.root.addChild(this.pingvin2);

    this.loader3 = new GLTFLoader(this.gl);
    this.loader3.load("modeli/pingvin/pingvin2.gltf");
    this.pingvin3 = new Node();
    this.pingvin3.model = this.loader3;
    this.root.addChild(this.pingvin3);

    // premikanje kamere
    // let t4 = this.camera.transform;
    // mat4.fromTranslation(t4, [15, 7, 0]);
    // mat4.rotateY(t4, t4, 0.4);
    // mat4.rotateX(t4, t4, -0.7853);

    // Set two variables for controlling the cubes' rotations from GUI.
    this.leftRotation = 0;
    this.rightRotation = 0;
    this.forward = 0;
  }

  update() {
    // PREMIKANJE IN ROTIRANJE
    // mat4.fromTranslation(t1, [2 * pozicijaY, pozicijaZ, -2 * pozicijaX]);
    // mat4.rotateX(t1, t1, this.leftRotation);
    if (this.pingvin.model.gltf) {
      let s1 = this.pingvin.model.gltf;
      // console.log(s1.nodes[2].transform);
      if (s1.nodes[2].transform) {
        let t2 = s1.nodes[2].transform;
        mat4.fromTranslation(t2, [2 * pozicijaY, pozicijaZ + 1, -2 * pozicijaX]);
        mat4.rotateX(t2, t2, 1.570796);
        mat4.rotateZ(t2, t2, smerFigure);
      }
    }

    if (this.pingvin2.model.gltf) {
      let s2 = this.pingvin2.model.gltf;
      // console.log(s1.nodes[2].transform);
      if (s2.nodes[2].transform) {
        let t3 = s2.nodes[2].transform;
        mat4.fromTranslation(t3, [2 * pozicijaY + 2, pozicijaZ, -2 * pozicijaX]);
        mat4.rotateX(t3, t3, 1.570796);
        // mat4.rotateZ(t3, t3, smerFigure);
      }
    }

    if (this.pingvin3.model.gltf) {
      let s3 = this.pingvin3.model.gltf;
      // console.log(s1.nodes[2].transform);
      if (s3.nodes[2].transform) {
        let t4 = s3.nodes[2].transform;
        mat4.fromTranslation(t4, [2 * pozicijaY, pozicijaZ, -2 * pozicijaX + 1]);
        mat4.rotateX(t4, t4, 1.570796);
        // mat4.rotateZ(t3, t3, smerFigure);
      }
    }

    // if (this.pingvin2.model.gltf) {
    //   let s2 = this.pingvin2.model.gltf;
    //   // console.log(s1.nodes[2].transform);
    //   if (s2.nodes[2].transform) {
    //     let t3 = s2.nodes[2].transform;
    //     mat4.fromTranslation(t3, [2 * pozicijaY + 2, pozicijaZ, -2 * pozicijaX]);
    //     mat4.rotateX(t3, t3, 1.570796);
    //     mat4.rotateZ(t3, t3, 3.14159265);
    //   }
    // }
  }

  render() {
    if (!this.loader.built || !this.loader2.built || !this.loader3.built) {
      return;
    }

    if (this.nastaviKamero == true) {
      const camera = this.loader.getObjectByName("Camera");
      // console.log(camera.transform);
      let t4 = camera.transform;
      mat4.rotateY(t4, t4, -0.3);
      mat4.rotateZ(t4, t4, -0.3);
      // mat4.fromTranslation(t4, [2 * pozicijaY + 2, pozicijaZ, -2 * pozicijaX]);
      this.nastaviKamero = false;
    }
    const camera = this.loader.getObjectByName("Camera");
    let scene = this.loader.getObjectByName("Scene");
    let scene2 = this.loader2.getObjectByName("Scene");
    let scene3 = this.loader3.getObjectByName("Scene");
    // treba naloudati vse in jih zdruzit vse v eno sceno
    let vseScene = { name: "Scene", nodes: scene.nodes.concat(scene2.nodes).concat(scene3.nodes) };
    console.log(vseScene);

    // console.log(camera.transform);
    // let t4 = camera.transform;
    // mat4.fromYRotation(t4, t4, this.leftRotation);
    // mat4.fromXRotation(t4, t4, -0.7853);

    if (!scene || !camera) {
      throw new Error("Scene or camera not present in glTF");
    }

    this.renderer.render(vseScene, camera);
    // this.renderer.render(scene2, camera);
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    console.log(w);
    console.log(h);
    const aspect = w / h;
    const fov = 50;
    const fovy = Math.PI / 2;
    const near = 0.1;
    const far = 100;
    // naredi da je ortografsko, perpendiclar, da je pravokotno, pod kotom 45 stopinj to potem lihk rata isometricno
    // mat4.ortho(this.camera.projection, -w / fov, w / fov, -h / fov, h / fov, -1000, 1000);
    // mat4.perspective(this.camera.projection, fovy, aspect, near, far);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector("canvas");
  const app = new App(canvas);
  const gui = new dat.GUI();
  gui.add(app, "leftRotation", -3, 3);
  gui.add(app, "forward", -500, 500);
  gui.add(app, "rightRotation", -3, 3);
});
