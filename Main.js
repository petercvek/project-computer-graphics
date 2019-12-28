import Application from "./common/Application.js";
import * as WebGL from "./WebGL.js";

import Node from "./Node.js";

import shaders from "./shaders.js";
import * as CubeModel from "./cube.js";

import GLTFLoader from "./GLTFLoader.js";
import Renderer from "./Renderer.js";

import Trees from "./Trees.js";

const mat4 = glMatrix.mat4;

let pozicijaX = 1; // min 0
let pozicijaY = 1.5; // max 10, 5 sredina
let pozicijaZ = 0;
let premikam = false;
let smerFigure = 3.14159265;

let trees = new Trees(); // nazačetku takoj doda 10 vrstic dreves (samo da se bo vidlo kako se sproti generirajo, potem bomo na začetku zgeneriral cca. 20 vrstic dreves)
function round(value, decimals) {
  return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

function samoSkoci() {
  var time = 0;
  var interval = setInterval(function() {
    if (time < 50) {
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

function deepCopy(obj) {
  var rv;

  switch (typeof obj) {
    case "object":
      if (obj === null) {
        // null => null
        rv = null;
      } else {
        switch (toString.call(obj)) {
          case "[object Array]":
            // It's an array, create a new array with
            // deep copies of the entries
            rv = obj.map(deepCopy);
            break;
          case "[object Date]":
            // Clone the date
            rv = new Date(obj);
            break;
          case "[object RegExp]":
            // Clone the RegExp
            rv = new RegExp(obj);
            break;
          // ...probably a few others
          default:
            // Some other kind of object, deep-copy its
            // properties into a new object
            rv = Object.keys(obj).reduce(function(prev, key) {
              prev[key] = deepCopy(obj[key]);
              return prev;
            }, {});
            break;
        }
      }
      break;
    default:
      // It's a primitive, copy via assignment
      rv = obj;
      break;
  }
  return rv;
}

function premik(smer, usmerjenost) {
  var time = 0;
  var interval = setInterval(function() {
    if (time < 50) {
      if (smer === "x") {
        if (usmerjenost === "+") {
          // Naprej - W
          pozicijaX = round(pozicijaX + 0.01, 3);
          // nova vrstica vedno ko pritisneš [W]
        } else {
          // Nazaj - S
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
      smerFigure = 3.14159265;
      if (trees.map[(1.5 + pozicijaX) * 2][(0.5 + pozicijaY) * 2] !== 1) {
        premik("x", "+");
      } else {
        samoSkoci();
      }
      trees.nextLine();
    } else if (e.code === "KeyS") {
      smerFigure = 0;
      if (trees.map[(0.5 + pozicijaX) * 2][(0.5 + pozicijaY) * 2] !== 1) {
        premik("x", "-");
      } else {
        samoSkoci();
      }
    } else if (e.code === "KeyD") {
      smerFigure = -1.57079;
      if (trees.map[(1 + pozicijaX) * 2][(1 + pozicijaY) * 2] !== 1) {
        premik("y", "+");
      } else {
        samoSkoci();
      }
    } else if (e.code === "KeyA") {
      smerFigure = 1.57079;
      if (trees.map[(1 + pozicijaX) * 2][pozicijaY * 2] !== 1) {
        premik("y", "-");
      } else {
        samoSkoci();
      }
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
      let loader4 = new GLTFLoader(this.gl);
      let gltf2 = await loader4.load("modeli/vampire/vampire.gltf");
      this.hero = gltf2;

      let grassLoader = new GLTFLoader(this.gl);
      let grassGltf = await grassLoader.load("modeli/grass/grass.gltf");
      let mesh = grassGltf.scenes[0].nodes[0].mesh;

      // let gltfScena = gltf.scenes[0].nodes[0];
      // console.log(grassGltf);

      for (let i = 0; i < 20; i++) {
        const gltf = deepCopy(grassGltf); // Object.assign({ index: i }, grassGltf);
        let t = gltf.scenes[0].nodes[0].transform;
        mat4.fromTranslation(t, [3, 0, 8 - i]);
        mat4.rotateX(t, t, 1.570796);
        gltf.scenes[0].nodes[0].mesh = mesh;
        // console.log(gltf.scenes[0].nodes[0].transform);
        this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
      }
      // console.log(this.vseSceneVIgri);

      let enviromentObjects = [
        "tree/tree0.gltf",
        "tree/tree1.gltf",
        "tree/tree2.gltf",
        "tree/tree3.gltf",
        "rock/rock.gltf",
        "rock/rock2.gltf"
      ];
      // let drevoLoader = new GLTFLoader(this.gl);
      // this.drevoGltf = await drevoLoader.load("modeli/tree/tree0.gltf");

      for (let i = 0; i < trees.map.length; i++) {
        for (let j = 0; j < trees.map[i].length; j++) {
          if (trees.map[i][j] == 1) {
            // let gltfScena = await Object.assign({}, this.drevoGltf.scenes[0]);
            // console.log(gltfScena.nodes[0].transform);

            // let loader = new GLTFLoader(this.gl);

            let drevoLoader = new GLTFLoader(this.gl);
            // let gltf = await drevoLoader.load("modeli/" + enviromentObjects[Math.floor(Math.random() * enviromentObjects.length)]);
            let gltf = await drevoLoader.load("modeli/tree/tree0.gltf");
            let t = gltf.scenes[0].nodes[0].transform;
            mat4.fromTranslation(t, [j - 1, 0.5, -i + 2]);
            mat4.rotateX(t, t, 1.570796);
            this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
            // console.log(gltfScena.nodes[0].transform);
            // console.log(this.vseSceneVIgri);
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
    this.izrisanihVrstic = trees.map.length;
  }

  update() {
    const izrisiNoveVrstice = async izrisanihVrstic => {
      for (let i = izrisanihVrstic; i < trees.map.length; i++) {
        for (let j = 0; j < trees.map[i].length; j++) {
          if (trees.map[i][j] == 1) {
            const gltfScena = Object.assign({}, this.drevoGltf.scenes[0]);
            // const randomObjekt = Object.assign({}, objketi[Math.floor(Math.random() * objketi.length)]);
            // let loader = new GLTFLoader(this.gl);
            // let gltf = await loader.load("modeli/" + enviromentObjects[Math.floor(Math.random() * enviromentObjects.length)]);
            // let gltf = await loader.load("modeli/tree/tree0.gltf");
            let t = gltfScena.nodes[0].transform;
            mat4.fromTranslation(t, [j - 1, 0.5, -i + 2]);
            mat4.rotateX(t, t, 1.570796);
            this.vseSceneVIgri.push(gltfScena.nodes[0]);
            console.log(this.vseSceneVIgri);
          }
        }
      }
    };

    // PREMIKANJE IN ROTIRANJE
    if (this.hero) {
      let s1 = this.hero;
      if (s1.nodes[2].transform) {
        let t2 = s1.nodes[2].transform;
        mat4.fromTranslation(t2, [2 * pozicijaY, pozicijaZ + 0.5, -2 * pozicijaX]);
        mat4.rotateX(t2, t2, 1.570796);
        mat4.rotateZ(t2, t2, smerFigure);
      }
      let camera = this.hero.nodes[0];
      let t4 = camera.transform;
      mat4.getRotation(t4, t4);
      mat4.fromRotationTranslation(t4, t4, [0.665 * pozicijaX + 1.33, 0, -1 * pozicijaX - 1]);
    }
    if (this.izrisanihVrstic != trees.map.length) {
      console.log(trees.map.length);
      // izrisiNoveVrstice(this.izrisanihVrstic);
      this.izrisanihVrstic++;
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
      // mat4.rotateX(t4, t4, -0.2);
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
