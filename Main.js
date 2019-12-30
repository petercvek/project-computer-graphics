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
let score = 0;
let st_ceste = 0; // 1-inf. - stevilka ceste (služi tudi kot score) kjer se karakter trenutno nahaja (začne se z 1)
let cx = 2; // index kjer je karakter (namesto da gre u minus in po +0.5 gre od 0 do inf. u korakih +1)

let trees = new Trees(); // nazačetku takoj doda 10 vrstic dreves (samo da se bo vidlo kako se sproti generirajo, potem bomo na začetku zgeneriral cca. 20 vrstic dreves)
function round(value, decimals) {
  return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
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

function samoSkoci() {
  new Between(pozicijaZ, pozicijaZ + 0.3)
    .time(100)
    .loop("bounce", 2)
    .on("update", value => {
      pozicijaZ = value;
    })
    .on("complete", () => {
      premikam = false;
    });
}

function premik(smer, usmerjenost) {
  if (smer === "x") {
    const trenutna = pozicijaX;
    let koncna;
    if (usmerjenost === "+") {
      // Naprej - W
      koncna = pozicijaX + 0.5;
    } else {
      // Nazaj - S
      koncna = pozicijaX - 0.5;
    }
    new Between(trenutna, koncna)
      .time(200)
      .on("update", value => {
        pozicijaX = value;
      })
      .on("complete", value => {
        if (score < value * 2) {
          score = value * 2;
          document.getElementById("score").innerHTML = score;
        }
      });
  } else {
    const trenutna = pozicijaY;
    let koncna;
    if (usmerjenost === "+") {
      koncna = pozicijaY + 0.5;
    } else {
      koncna = pozicijaY - 0.5;
    }
    new Between(trenutna, koncna).time(200).on("update", value => {
      pozicijaY = value;
    });
  }
  // skok v zrak
  new Between(pozicijaZ, pozicijaZ + 0.3)
    .time(100)
    .loop("bounce", 2)
    .on("update", value => {
      pozicijaZ = value;
    })
    .on("complete", () => {
      premikam = false;
    });
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
      if (!trees.isTreeLine(trees.map[cx + 1]) && cx > 2) {
        // če je polje kjer se nahaja karakter cesta
        st_ceste++;
      }
    } else if (e.code === "KeyS") {
      smerFigure = 0;
      if (trees.map[(0.5 + pozicijaX) * 2][(0.5 + pozicijaY) * 2] !== 1) {
        premik("x", "-");
      } else {
        samoSkoci();
      }
      if (!trees.isTreeLine(trees.map[cx]) && cx > 2) {
        st_ceste--;
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
  // console.log("X: " + pozicijaX, "Y: " + pozicijaY, "Z: " + pozicijaZ);
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
  avti = [];

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

    const generirajSvet = async () => {
      this.loader = new GLTFLoader(this.gl);
      this.grassGltf = await this.loader.load("modeli/grass/grass.gltf");
      this.grassMesh = this.grassGltf.scenes[0].nodes[0].mesh;
      this.roadGltf = await this.loader.load("modeli/road/road.gltf");
      this.roadMesh = this.roadGltf.scenes[0].nodes[0].mesh;

      // naredi 20 vrstic trave
      for (let i = 0; i < 10; i++) {
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

      this.roads = [];

      for (let i = 0; i < trees.map.length; i++) {
        if (!trees.isTreeLine(trees.map[i])) {
          // če ni dreves v tisti liniji naredi tam cesto
          let gltf = deepCopy(this.roadGltf);
          gltf.scenes[0].nodes[0].mesh = this.roadMesh;
          let t = gltf.scenes[0].nodes[0].transform;
          mat4.fromTranslation(t, [3, 0, -i - 2]);
          mat4.rotateX(t, t, 1.570796);
          this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
          let road = new Cars(i);
          this.roads.push(road);
        } else {
          let gltf = deepCopy(this.grassGltf); // naredi kopijo
          gltf.scenes[0].nodes[0].mesh = this.grassMesh; // doda mu mesh ker se pri kopiranju nekaj unici
          let t = gltf.scenes[0].nodes[0].transform; // nastima pozicijo
          mat4.fromTranslation(t, [3, 0, -i - 2]);
          mat4.rotateX(t, t, 1.570796);
          this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]); // doda v sceno

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
        }
      }

      this.heroGltf = await this.loader.load("modeli/vampire/vampire.gltf");
      this.hero = this.heroGltf;
      this.vseSceneVIgri.push(this.heroGltf.scenes[0].nodes[1]);
      this.nalozeno = true;

      this.carGltf = await this.loader.load("modeli/car/car.gltf");
      let carMesh = this.carGltf.scenes[0].nodes[0].mesh;
      this.car = this.carGltf;

      for (let k = 0; k < 50; k++) {
        let gltf = deepCopy(this.carGltf);
        gltf.scenes[0].nodes[0].mesh = carMesh;
        let t = gltf.scenes[0].nodes[0].transform;

        mat4.fromTranslation(t, [0, -2, 0]);
        this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);

        this.avti.push(gltf);
      }
    };
    this.end = false;
    generirajSvet();
    this.izrisanihVrstic = trees.map.length;
  }

  update() {
    const izrisiNoveVrstice = async () => {
      for (let i = this.izrisanihVrstic; i < trees.map.length; i++) {
        if (!trees.isTreeLine(trees.map[i])) {
          // če ni dreves v tisti liniji naredi tam cesto
          let gltf = deepCopy(this.roadGltf);
          gltf.scenes[0].nodes[0].mesh = this.roadMesh;
          let t = gltf.scenes[0].nodes[0].transform;
          mat4.fromTranslation(t, [3, 0, -i - 2]);
          mat4.rotateX(t, t, 1.570796);
          this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
          let road = new Cars(i);
          this.roads.push(road);
        } else {
          let gltf = deepCopy(this.grassGltf); // naredi kopijo
          gltf.scenes[0].nodes[0].mesh = this.grassMesh; // doda mu mesh ker se pri kopiranju nekaj unici
          let t = gltf.scenes[0].nodes[0].transform; // nastima pozicijo
          mat4.fromTranslation(t, [3, 0, -i - 2]);
          mat4.rotateX(t, t, 1.570796);
          this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]); // doda v sceno
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
        }

        this.izrisanihVrstic++;
      }
    };
    if (!this.end) {
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
        // console.log(trees.map.length);
        izrisiNoveVrstice();
      }

      if (this.car) {
        let counter = 0;
        for (let vrstica = 0; vrstica < this.roads.length; vrstica++) {
          for (let avto = 0; avto < this.roads[vrstica].cars.length; avto++) {
            if (counter >= 49) {
              break;
            }
            let enAvto = this.avti[counter];
            let matrika = enAvto.scenes[0].nodes[0].transform;
            if (this.roads[vrstica].cars[avto].xPosition * 0.5 - pozicijaX < -7) {
              this.roads[vrstica].deleteRow();
              vrstica++;
              continue;
            } else {
              mat4.fromTranslation(matrika, [this.roads[vrstica].cars[avto].yPosition, 0.4, -this.roads[vrstica].cars[avto].xPosition - 2]);
              mat4.rotateX(matrika, matrika, 1.570796);
              if (this.roads[vrstica].direction == 1) {
                // zavrti v tisto smer k je obrnjen
                mat4.rotateZ(matrika, matrika, 4.712388);
              } else {
                mat4.rotateZ(matrika, matrika, 1.570796);
              }
              counter++;
            }
          }
        }
      }
    }
    // mapiranje pozicije X karakterja v index ceste na keteri se nahaja = (pozicijaX -1.5) * 2 + 1
    // let trenutna_cesta = (pozicijaX -1.5) * 2 + 1;

    // collision detection:
    if (st_ceste > 0 && !trees.isTreeLine(trees.map[Math.round(cx)])) {
      // če ni TreeLine pomeni, da se nahaja na cesti in je killable
      for (let i = 0; i < this.roads[st_ceste - 1].cars.length; i++) {
        // loop čez objekte avtov v vrstici kjer se trenutno nahaja karakter
        if (this.roads[st_ceste - 1].cars[i].isHit(pozicijaY))
          // če ga avto zadane (glej razred car -> isHit)
          // kaj narediti ko umreš:
          // console.log("dead");
          this.end = true;
      }
    }
    cx = (pozicijaX + 1) * 2;
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
