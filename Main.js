import Application from "./common/Application.js";
import * as WebGL from "./WebGL.js";

import shaders from "./shaders.js";

import GLTFLoader from "./GLTFLoader.js";
import Renderer from "./Renderer.js";

import Trees from "./Trees.js";
import Cars from "./Cars.js";

const mat4 = glMatrix.mat4;

let pozicijaX = 0; // min 0
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
      trees.nextLine(); // nova vrstica vedno ko klikns W
    } else if (e.code === "KeyS") {
      smerFigure = 0;
      if (trees.map[(0.5 + pozicijaX) * 2][(0.5 + pozicijaY) * 2] !== 1) {
        premik("x", "-");
      } else {
        samoSkoci();
      }
    } else if (e.code === "KeyD") {
      smerFigure = -1.57079;
      if (trees.map[(1 + pozicijaX) * 2][(1 + pozicijaY) * 2] !== 1 && pozicijaY < 3.5) {
        premik("y", "+");
      } else {
        samoSkoci();
      }
    } else if (e.code === "KeyA") {
      smerFigure = 1.57079;
      if (trees.map[(1 + pozicijaX) * 2][pozicijaY * 2] !== 1 && pozicijaY > -0.5) {
        premik("y", "-");
      } else {
        samoSkoci();
      }
    }
  }
  console.log("X: " + pozicijaX, "Y: " + pozicijaY, "Z: " + pozicijaZ);
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

    this.cars = new Cars();
    console.log(this.cars.cars[0].position);

    const generirajSvet = async () => {
      this.loader = new GLTFLoader(this.gl);
      this.grassGltf = await this.loader.load("modeli/grass/grass.gltf");
      this.grassMesh = this.grassGltf.scenes[0].nodes[0].mesh;
      this.roadGltf = await this.loader.load("modeli/road/road.gltf");
      this.roadMesh = this.roadGltf.scenes[0].nodes[0].mesh;

      // naredi 20 vrstic trave
      for (let i = 0; i < 11; i++) {
        let gltf = deepCopy(this.grassGltf); // naredi kopijo
        gltf.scenes[0].nodes[0].mesh = this.grassMesh; // doda mu mesh ker se pri kopiranju nekaj unici
        let t = gltf.scenes[0].nodes[0].transform; // nastima pozicijo
        mat4.fromTranslation(t, [3, 0, 8 - i]);
        mat4.rotateX(t, t, 1.570796);
        this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]); // doda v sceno
      }

      let drevo0Gltf = await this.loader.load("modeli/tree/tree0.gltf");
      let drevo0Mesh = drevo0Gltf.scenes[0].nodes[0].mesh;
      let drevo1Gltf = await this.loader.load("modeli/tree/tree1.gltf");
      let drevo1Mesh = drevo1Gltf.scenes[0].nodes[0].mesh;
      let drevo2Gltf = await this.loader.load("modeli/tree/tree2.gltf");
      let drevo2Mesh = drevo2Gltf.scenes[0].nodes[0].mesh;
      let rock0Gltf = await this.loader.load("modeli/rock/rock.gltf");
      let rock0Mesh = rock0Gltf.scenes[0].nodes[0].mesh;

      this.enviromentObjects = [drevo0Gltf, drevo1Gltf, drevo2Gltf, rock0Gltf];
      this.enviromentObjectsMesh = [drevo0Mesh, drevo1Mesh, drevo2Mesh, rock0Mesh];

      for (let i = 0; i < trees.map.length; i++) {
        for (let j = 0; j < trees.map[i].length; j++) {
          let randomNumber = Math.floor(Math.random() * this.enviromentObjects.length);
          if (trees.map[i][j] == 1) {
            let gltf = deepCopy(this.enviromentObjects[randomNumber]);
            gltf.scenes[0].nodes[0].mesh = this.enviromentObjectsMesh[randomNumber];

            let t = gltf.scenes[0].nodes[0].transform;
            mat4.fromTranslation(t, [j - 1, 0.4, -i + 2]);
            mat4.rotateX(t, t, 1.570796);

            this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
          }
        }
        if (!trees.isTreeLine(trees.map[i])) {
          // če ni dreves v tisti liniji naredi tam cesto
          let gltf = deepCopy(this.roadGltf);
          gltf.scenes[0].nodes[0].mesh = this.roadMesh;
          let t = gltf.scenes[0].nodes[0].transform;
          mat4.fromTranslation(t, [3, 0, -i - 2]);
          mat4.rotateX(t, t, 1.570796);
          this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
        } else {
          let gltf = deepCopy(this.grassGltf); // naredi kopijo
          gltf.scenes[0].nodes[0].mesh = this.grassMesh; // doda mu mesh ker se pri kopiranju nekaj unici
          let t = gltf.scenes[0].nodes[0].transform; // nastima pozicijo
          mat4.fromTranslation(t, [3, 0, -i - 2]);
          mat4.rotateX(t, t, 1.570796);
          this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]); // doda v sceno
        }
      }

      let heroGltf = await this.loader.load("modeli/vampire/vampire.gltf");
      this.hero = heroGltf;
      this.vseSceneVIgri.push(heroGltf.scenes[0].nodes[1]);
      this.nalozeno = true;
    };

    generirajSvet();
    this.izrisanihVrstic = trees.map.length;
  }

  update() {
    const izrisiNoveVrstice = async () => {
      for (let i = this.izrisanihVrstic; i < trees.map.length; i++) {
        for (let j = 0; j < trees.map[i].length; j++) {
          let randomNumber = Math.floor(Math.random() * this.enviromentObjects.length);
          if (trees.map[i][j] == 1) {
            let gltf = deepCopy(this.enviromentObjects[randomNumber]);
            gltf.scenes[0].nodes[0].mesh = this.enviromentObjectsMesh[randomNumber];
            let t = gltf.scenes[0].nodes[0].transform;
            mat4.fromTranslation(t, [j - 1, 0.4, -i + 2]);
            mat4.rotateX(t, t, 1.570796);

            this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
          }
        }

        let gltf = deepCopy(this.grassGltf);
        gltf.scenes[0].nodes[0].mesh = this.grassMesh;
        let t = gltf.scenes[0].nodes[0].transform;
        mat4.fromTranslation(t, [3, 0, -i]);
        mat4.rotateX(t, t, 1.570796);
        this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);

        this.izrisanihVrstic++;
      }
    };

    // PREMIKANJE IN ROTIRANJE
    if (this.hero) {
      let s1 = this.hero;
      if (s1.nodes[2].transform) {
        let t2 = s1.nodes[2].transform;
        mat4.fromTranslation(t2, [2 * pozicijaY, pozicijaZ + 0.4, -2 * pozicijaX]);
        mat4.rotateX(t2, t2, 1.570796);
        mat4.rotateZ(t2, t2, smerFigure);
      }
      let camera = this.hero.nodes[0];
      let t4 = camera.transform;
      mat4.getRotation(t4, t4);
      mat4.fromRotationTranslation(t4, t4, [0.665 * pozicijaX + 1.33, 0, -1 * pozicijaX - 1]);
    }
    if (this.izrisanihVrstic != trees.map.length && !premikam) {
      console.log(trees.map.length);
      izrisiNoveVrstice();
    }

    // if (this.hero) {
    //   let s1 = this.hero;
    //   if (s1.nodes[2].transform) {
    //     let t2 = s1.nodes[2].transform;
    //     mat4.fromTranslation(t2, [this.cars.cars[0].position, pozicijaZ + 0.5, -2 * pozicijaX]);
    //   }
    // }

    // console.log(this.cars.cars[0].position);
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
