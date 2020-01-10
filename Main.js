import Application from "./common/Application.js";
import * as WebGL from "./WebGL.js";
import shaders from "./shaders.js";

import GLTFLoader from "./GLTFLoader.js";
import Renderer from "./Renderer.js";

import Trees from "./Trees.js";
import Cars from "./Cars.js";
import Sounds from "./Sounds.js";

const mat4 = glMatrix.mat4;

let izbranCharacter = document.location.search.replace("?character=", ""); // penguin/vampire - karakter, ki smo ga izbrali na frontpagu
let pozicijaX = 0; // min 0
let pozicijaY = 1.5; // max 10, 5 sredina
let pozicijaZ = 0;
let premikam = false;
let smerFigure = 3.14159265;
let sound = new Sounds();
let score = 0;
let st_ceste = 0; // 1-inf. - stevilka ceste (služi tudi kot score) kjer se karakter trenutno nahaja (začne se z 1)
let cx = 2; // index kjer je karakter (namesto da gre u minus in po +0.5 gre od 0 do inf. u korakih +1)
let end = false;
let quote = ""; // random quote, ki se prikaže ko umreš
let trees = new Trees(); // nazačetku takoj doda 10 vrstic dreves (samo da se bo vidlo kako se sproti generirajo, potem bomo na začetku zgeneriral cca. 20 vrstic dreves)

function deepCopy(obj) {
  let rv;
  if (typeof obj === "object") {
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
  } else {
    rv = obj;
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
        if (score - trees.coins * 5 < value * 2) {
          // odšteješ število kovancev * 5 da gre pravilno v if (vsak kovanec je 5 točk)
          score += 1;
        }
        if (trees.isCoin(pozicijaX, pozicijaY)) {
          score += 5;
          sound.gotCoin.play();
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
    new Between(trenutna, koncna)
      .time(200)
      .on("update", value => {
        pozicijaY = value;
      })
      .on("complete", value => {
        if (trees.isCoin(pozicijaX, pozicijaY)) {
          score += 5;
          sound.gotCoin.play();
        }
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
      document.getElementById("score").innerHTML = score;
    });
}

const keydownHandler = e => {
  if (premikam || end) {
    return 0;
  } else {
    premikam = true;
    if (e.code === "KeyW") {
      smerFigure = 3.14159265;
      if (trees.map[(1.5 + pozicijaX) * 2][(0.5 + pozicijaY) * 2] !== 1) {
        premik("x", "+");
        trees.nextLine(); // nova vrstica vedno ko klikns W
      } else {
        samoSkoci();
      }
      if (!trees.isTreeLine(trees.map[cx + 1]) && cx > 2) {
        // če je polje kjer se nahaja karakter cesta
        st_ceste++;
      }
    } else if (e.code === "KeyS") {
      smerFigure = 0;
      if (trees.map[(0.5 + pozicijaX) * 2][(0.5 + pozicijaY) * 2] !== 1) {
        premik("x", "-");
        if (!trees.isTreeLine(trees.map[cx]) && cx > 2) {
          st_ceste--;
        }
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
};
const keyupHandler = e => {};

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
    // this.programs = WebGL.buildPrograms(gl, shaders);
  }

  async loadAllObjects() {
    this.loader = new GLTFLoader(this.gl);

    this.grassGltf = await this.loader.load("modeli/grass/grass.gltf");
    this.grassMesh = this.grassGltf.scenes[0].nodes[0].mesh;
    this.roadGltf = await this.loader.load("modeli/road/road.gltf");
    this.roadMesh = this.roadGltf.scenes[0].nodes[0].mesh;

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

    this.coinGltf = await this.loader.load("modeli/coin/coin.gltf");
    this.coinMesh = this.coinGltf.scenes[0].nodes[0].mesh;

    // v spodnjem odseku (10 vrsticah) kode je vrstni red nalaganja objektov drugačen glede na izbran karakter,
    // ker drugače pride do errorja "insufficient buffer size" in enega od objektov ne naloži (avtomobila/ov).
    // ker nismo znali priti do razloga zakaj se error pojavi v različnih vrstnih redih smo kodo zgolj prilagodili tako, da do errorja ne prihaja
    if (izbranCharacter === "vampire") {
      this.heroGltf = await this.loader.load("modeli/vampire/vampire.gltf");
      this.carGltf = await this.loader.load("modeli/car/car.gltf");
      this.carMesh = this.carGltf.scenes[0].nodes[0].mesh;
    } else if (izbranCharacter === "penguin") {
      this.carGltf = await this.loader.load("modeli/car/car.gltf");
      this.carMesh = this.carGltf.scenes[0].nodes[0].mesh;
      this.heroGltf = await this.loader.load("modeli/pingvin/pingvin2.gltf");
    }
    this.hero = this.heroGltf;

    this.vseSceneVIgri.push(this.heroGltf.scenes[0].nodes[1]);
    this.nalozeno = true;
    return true;
  }

  async start() {
    // const gl = this.gl;
    this.initGL();

    this.cars = new Cars();

    const generirajSvet = async () => {
      // naredi 20 vrstic trave
      for (let i = 0; i < 10; i++) {
        let gltf = deepCopy(this.grassGltf); // naredi kopijo
        gltf.scenes[0].nodes[0].mesh = this.grassMesh; // doda mu mesh ker se pri kopiranju nekaj unici
        let t = gltf.scenes[0].nodes[0].transform; // nastima pozicijo
        mat4.fromTranslation(t, [3, 0, 8 - i]);
        // mat4.scale(t, t, [1.35,1,1]);
        mat4.rotateX(t, t, 1.570796);
        this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]); // doda v sceno
      }

      this.roads = [];
      this.coins = {};

      for (let i = 0; i < trees.map.length; i++) {
        for (let j = 0; j < trees.map[i].length; j++) {
          let randomNumber = Math.floor(Math.random() * this.enviromentObjects.length);
          if (trees.map[i][j] === 1) {
            let gltf = deepCopy(this.enviromentObjects[randomNumber]);
            gltf.scenes[0].nodes[0].mesh = this.enviromentObjectsMesh[randomNumber];

            let t = gltf.scenes[0].nodes[0].transform;
            mat4.fromTranslation(t, [j - 1, 0.4, -i + 2]);
            mat4.rotateX(t, t, 1.570796);

            this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
          } else if (trees.map[i][j] === 2) {
            let gltf = deepCopy(this.coinGltf);
            gltf.scenes[0].nodes[0].mesh = this.coinMesh;
            let t = gltf.scenes[0].nodes[0].transform;
            mat4.fromTranslation(t, [j - 1, 0.4, -i + 2]);
            mat4.rotateX(t, t, 1.570796);
            this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);

            this.coins[i + "," + j] = gltf;
          }
        }
        this.izrisCesteInTrave(i); // če je tree line naredi travo, če ne naredi cesto
      }

      for (let k = 0; k < 100; k++) {
        let gltf = deepCopy(this.carGltf);
        gltf.scenes[0].nodes[0].mesh = this.carMesh;
        let t = gltf.scenes[0].nodes[0].transform;

        mat4.fromTranslation(t, [0, -2, 0]);
        this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);

        this.avti.push(gltf);
      }
    };

    await this.loadAllObjects();

    generirajSvet();

    this.izrisanihVrstic = trees.map.length;
  }

  update() {
    const izrisiNoveVrstice = async () => {
      for (let i = this.izrisanihVrstic; i < trees.map.length; i++) {
        for (let j = 0; j < trees.map[i].length; j++) {
          let randomNumber = Math.floor(Math.random() * this.enviromentObjects.length);
          if (trees.map[i][j] === 1) {
            let gltf = deepCopy(this.enviromentObjects[randomNumber]);
            gltf.scenes[0].nodes[0].mesh = this.enviromentObjectsMesh[randomNumber];
            let t = gltf.scenes[0].nodes[0].transform;
            mat4.fromTranslation(t, [j - 1, 0.4, -i + 2]);
            mat4.rotateX(t, t, 1.570796);
            this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
          } else if (trees.map[i][j] === 2) {
            let gltf = deepCopy(this.coinGltf);
            gltf.scenes[0].nodes[0].mesh = this.coinMesh;
            let t = gltf.scenes[0].nodes[0].transform;
            mat4.fromTranslation(t, [j - 1, 0.4, -i + 2]);
            mat4.rotateX(t, t, 1.570796);
            this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);

            this.coins[i + "," + j] = gltf;
          }
        }
        this.izrisCesteInTrave(i); // če je tree line naredi travo, če ne naredi cesto
        this.izrisanihVrstic++;
      }
    };
    if (!end) {
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
      if (this.izrisanihVrstic !== trees.map.length && !premikam) {
        izrisiNoveVrstice();
      }

      this.fewerCoins = {};

      for (let i = 0; i < trees.map.length; i++) {
        for (let j = 0; j < trees.map[0].length; j++) {
          if (trees.map[i][j] === 2) {
            this.fewerCoins[i + "," + j] = 1;
          }
        }
      }

      if (this.nalozeno) {
        let uredu;
        if (Object.keys(this.coins).length - Object.keys(this.fewerCoins).length === 1) {
          for (let key in this.coins) {
            for (let key2 in this.fewerCoins) {
              if (key2 == key) {
                uredu = true;
                break;
              }
              uredu = false;
            }
            if (uredu) {
              continue;
            } else {
              let t = this.coins[key].scenes[0].nodes[0].transform;
              mat4.fromTranslation(t, t, [0, 20, 0]);
              delete this.coins[key];
              break;
            }
          }
        }

        for (let key in this.coins) {
          let t = this.coins[key].scenes[0].nodes[0].transform;
          mat4.rotateZ(t, t, 0.05);
        }
      }

      if (this.nalozeno) {
        let counter = 0;
        for (let vrstica = 0; vrstica < this.roads.length; vrstica++) {
          for (let avto = 0; avto < this.roads[vrstica].cars.length; avto++) {
            if (counter > 99) {
              break;
            }
            let enAvto = this.avti[counter];
            let matrika = enAvto.scenes[0].nodes[0].transform;
            if (this.roads[vrstica].cars[avto].xPosition * 0.5 - pozicijaX < -10) {
              this.roads[vrstica].deleteRow();
              continue;
            }
            mat4.fromTranslation(matrika, [this.roads[vrstica].cars[avto].yPosition, 0.4, -this.roads[vrstica].cars[avto].xPosition - 2]);
            mat4.rotateX(matrika, matrika, 1.570796);
            if (this.roads[vrstica].direction === 1) {
              // zavrti v tisto smer k je obrnjen
              mat4.rotateZ(matrika, matrika, 4.712388);
            } else {
              mat4.rotateZ(matrika, matrika, 1.570796);
            }
            counter++;
          }
        }
      }
    } else {
      // end-screen:
      document.getElementById("endscreen").style.display = "block";
      document.getElementById("endScore").innerHTML = score;
      document.getElementById("score").style.display = "none";
      if (quote === "") {
        let quote_number = Math.floor(Math.random() * 5);
        if (quote_number === 0) {
          quote = "Pro tip: look left and right before crossing the road";
        } else if (quote_number === 1) {
          quote = "Better luck next time";
        } else if (quote_number === 2) {
          quote = "Uf I am not sure if insurance will cover that one";
        } else if (quote_number === 3) {
          quote = 'But at least you got to the "other side"';
        } else if (quote_number === 4) {
          quote = "Drivers are really ruthless these days huh";
        }
        document.getElementById("rndQuote").innerHTML = quote;
      }
    }

    // collision detection:
    if (st_ceste > 0 && !trees.isTreeLine(trees.map[Math.round(cx)])) {
      // če ni TreeLine pomeni, da se nahaja na cesti in je killable
      for (let i = 0; i < this.roads[st_ceste - 1].cars.length; i++) {
        // loop čez objekte avtov v vrstici kjer se trenutno nahaja karakter:
        if (this.roads[st_ceste - 1].cars[i].isClose(pozicijaY) && !end) {
          sound.carHorn.play();
          if (this.roads[st_ceste - 1].cars[i].isHit(pozicijaY) && !end) {
            // kaj narediti ko umreš:
            sound.hitByCar.play();
            end = true;
          }
        }
      }
    }
    cx = (pozicijaX + 1) * 2;
  }

  izrisCesteInTrave(i) {
    // console.log("vrstica: " + i + " " + !trees.isTreeLine(trees.map[i]));
    if (!trees.isTreeLine(trees.map[i])) {
      // če ni dreves v tisti liniji naredi tam cesto, če so naredi travo
      let gltf = deepCopy(this.roadGltf);
      gltf.scenes[0].nodes[0].mesh = this.roadMesh;
      let t = gltf.scenes[0].nodes[0].transform;
      mat4.fromTranslation(t, [3, 0, -i - 2]);
      // mat4.scale(t, t, [1.35,1,1]);
      mat4.rotateX(t, t, 1.570796);
      this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
      let road = new Cars(i);
      this.roads.push(road);
    } else {
      let gltf = deepCopy(this.grassGltf);
      gltf.scenes[0].nodes[0].mesh = this.grassMesh;
      let t = gltf.scenes[0].nodes[0].transform;
      mat4.fromTranslation(t, [3, 0, -i - 2]);
      // mat4.scale(t, t, [1.35,1,1]);
      mat4.rotateX(t, t, 1.570796);
      this.vseSceneVIgri.push(gltf.scenes[0].nodes[0]);
    }
  }

  render() {
    this.renderer = new Renderer(this.gl);
    if (!this.nalozeno) {
      return;
    }
    let camera = this.hero.nodes[0];
    if (this.nastaviKamero === true) {
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
