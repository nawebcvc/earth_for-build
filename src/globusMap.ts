import * as THREE from "three";
// import three lib as THREE - webgl3D lib
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// import OrbitControls from three lib
import gsap from "gsap";
// import gsap - animation tool lib
import { FontLoader } from "three/addons/loaders/FontLoader.js";
// import fontloader from three lib to load fonts
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
// import TextGeometry from three lib to show the text with his own geometry (you can`t use the text without this)
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
// import BufferGeometryUtils from three lib for optimization, for merging all 14596 planeGeometries (dots on the sphere) into one BufferGeometry(14596 geos -> 1 geo)
import { dotsSphere } from "./SpherePoints.js";
// i have X and Y coordinates for planeGeometries (dots), i collect cords from the function that i took from the video
// console.log(dotsSphere.length); // 29192 dots OMG...

import { InteractionManager } from "three.interactive";
// to add event listener to mesh objects, i love this library (*-*)

/* import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js"; */
// official libraries of three js that can draw mesh lines but doesn`t support dashArray attribute and consists mistakes and errors in typescript

// import * as meshLine from 'three.meshline/src/THREE.MeshLine.js';
// meshlines library: https://www.npmjs.com/package/three.meshline that very old :(

import { MeshLine, MeshLineGeometry, MeshLineMaterial } from '@lume/three-meshline';
// newest version of THREE.MeshLine by @lume: https://github.com/lume/three-meshline (thank you @lume for supporting this library)

// how to get cords of planeGeometries (dots) for sphere from any image:
// you need two things: the image (that we will use for filling with dots) and the function that can do this magic
// the amount of dots` cords depends on the size of the image and function,
// so i recommend to use size 240x120 (pixels) or over if you want high quality.
// what about the function that can get cords, you can get from the video (you know what i am talking about)
// so you can take the cords just put something to collect (maybe array) it in:
/* for (let y = 0; y < obj.w; y++) {// по оси Y
            for (let x = 0; x < obj.w; x++) {// по оси X
                const a = obj.data[((obj.w * y) + x) * 4 + 3];// берём только n-ные значения
                if (a > 200) {
                    obj.ar.push([x - obj.w, y - obj.w / 6.2])// здесь 6.2 — это как бы «отступ от севера»
                    // ... you can collect the cords from here, for example:
                    smthArray.push([x - obj.w, y - obj.w / 6.2]);
                }
            }
        } */
// so enjoy!

// const settings = {
//   // Make the loop animated
//   animate: true,
//   // Get a WebGL canvas rather than 2D
//   context: "webgl",
//   // Turn on MSAA6
//   attributes: { antialias: true },
// };
// hmm, how to set settings in three js with vite :D

const canvas = document.querySelector(".globes") as HTMLCanvasElement; // to show the webgl result in html DOM
const renderer = new THREE.WebGLRenderer({ canvas }); // renderer to render into canvas
renderer.setSize(window.innerWidth, window.innerHeight); // we are setting size of renderer with window width and height
renderer.setPixelRatio(2); // pixel ratio of the renderer

renderer.setClearColor("#000", 1); // background color of the renderer
// const camera = new THREE.PerspectiveCamera(12, window.innerWidth / window.innerHeight, 10, 11.4); // hmm can i use this code for optimization?
const camera = new THREE.PerspectiveCamera(
  12,
  window.innerWidth / window.innerHeight,
  0.1,
  45
);
camera.position.set(-10.4, 3, 0); // camera`s position
camera.setViewOffset(10, 10, -2, 0.5, 9, 9); // camera`s point of view

// setInterval(()=>{console.log(camera.position)}, 1000) // to log all changes of the camera position
// 10.85, 3.75, 2.1

camera.aspect = window.innerWidth / window.innerHeight; // aspect ratio of the camera
camera.updateProjectionMatrix(); // we must update the projection matrix, we must!

const controls = new OrbitControls(camera, canvas); // controls
controls.enableDamping = true;
controls.enablePan = false;

const scene = new THREE.Scene(); // scene

const interactionManager = new InteractionManager(
  renderer,
  camera,
  renderer.domElement
); // to add event listener to mesh objects

const lightGroup = new THREE.Object3D(); // light group for two lights
const alight = new THREE.DirectionalLight(0xffffff, 2); // first light
alight.position.set(-1.5, 1.7, 0.7);
lightGroup.add(alight);
const alight2 = new THREE.DirectionalLight(0xffffff, 2); // second light
alight.position.set(-1.5, 0.3, 0.7);
lightGroup.add(alight2);

// here i tried to instead of dots use pictures of dots (that i made in photoshop)
// const txrLoad = new THREE.TextureLoader();
// const imgTexture = txrLoad.load('./images/worldMAP/10.png');
// color: new THREE.Color(0x091e5a)

type Parent = THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshBasicMaterial>;
const parent: Parent = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1, 2),
  new THREE.MeshBasicMaterial({
    opacity: 1,
    transparent: true,
    side: THREE.BackSide,
  })
);
const meshHide = new THREE.Mesh(
  new THREE.SphereGeometry(1.0499, 64, 36),
  new THREE.MeshStandardMaterial({ color: new THREE.Color(0x091e5a) })
  // new THREE.MeshStandardMaterial({ map: imgTexture }) // yeah, using pictures instead of dots is not ideal...
);

// adding to the scene
scene.add(parent);
scene.add(meshHide);
scene.add(lightGroup);

enum EmathOp {
  add = "add",
  min = "min",
  sub = "sub",
  div = "div",
};
function mathArray(ar: number[], ar2: number[], op: EmathOp, fl?: number): number[] {
  // arr: first array, arr2: second array, op: math operation, rnd: to floor the each primitive 
  const r: number[] = [];
  let flN = 1;
  if (fl) {
    for (let i = 0; i < fl; i++) {
      flN *= 10
    }
  }
  ar.forEach((l, i) => {
    switch (op) {
      case "add":
        r.push(fl ? Math.floor((l + ar2[i]) * flN) / flN : l + ar2[i]);
        break;
      case "min":
        r.push(fl ? Math.floor((l - ar2[i]) * flN) / flN : l - ar2[i]);
        break;
      case "sub":
        r.push(fl ? Math.floor((l * ar2[i]) * flN) / flN : l * ar2[i]);
        break;
      case "div":
        r.push(fl ? Math.floor((l / ar2[i]) * flN) / flN : l / ar2[i]);
        break;
    }
  });
  return r;
};

// types that can be used for creation mesh cylinder-base and cylinder-body objects
type CylinderBody = THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
type CylinderBase = THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
type nmbrX3 = [number, number, number];
type nmbrX4 = [number, number, number, number];
interface DataPoint {
  main?: boolean;
  position1: nmbrX3;
  position2: nmbrX3;
  geometry1?: nmbrX4;
  geometry2?: nmbrX4;
  event1?: (event: any, mesh: CylinderBody) => void;
  event2?: (event: any, mesh: CylinderBase) => void;
}

// function that can create mesh cylinder-base and cylinder-body objects
function crtPoint(data: DataPoint) {
  const { main, position1, position2, geometry1, geometry2, event1, event2 } =
    data;
  const color = main ? 0x86c3f9 : 0x008dfb;

  const cylinderBody = new THREE.Mesh(
    new THREE.CylinderGeometry(...geometry1 || main ? [0.004, 0.004, 0.3, 12] : [0.004, 0.004, 0.2, 12]),
    new THREE.MeshBasicMaterial({ color: color })
  );
  cylinderBody.position.set(...position1);
  scene.add(cylinderBody);
  parent.add(cylinderBody);

  // if the event1 argument is true, we add event listener
  if (event1) {
    interactionManager.add(cylinderBody);
    cylinderBody.addEventListener("click", (event) =>
      event1(event, cylinderBody)
    );
  }

  const cylinderBase = new THREE.Mesh(
    new THREE.CircleGeometry(...geometry2 || main ? [0.02, 24, 0, 10] : [0.015, 24, 0, 10]),
    new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
    })
  );
  cylinderBase.position.set(...position2);
  cylinderBase.lookAt(new THREE.Vector3());
  scene.add(cylinderBase);
  parent.add(cylinderBase);

  // if the event2 argument is true, we add event listener
  if (event2) {
    interactionManager.add(cylinderBase);
    cylinderBase.addEventListener("click", (event) =>
      event2(event, cylinderBase)
    );
  }

  return { body: cylinderBody, base: cylinderBase };
} // create point in the scene

const inpRngs: NodeListOf<HTMLInputElement> = document.querySelectorAll(".rng"); // inputs with range
const cordsInfo = document.querySelector(".cords") as HTMLParagraphElement; // the cords paragraph
const cordsVisBtn = document.querySelector(".changePos") as HTMLButtonElement;
cordsVisBtn.addEventListener(
  "click",
  () => {
    (document.querySelector(".pos") as HTMLDivElement).classList.add("active");
  }
); // to change the position after button click

const cngMshpos = function (mesh: THREE.Mesh | THREE.Line) {
  cordsInfo.innerText = `X: ${mesh.position.x}, Y: ${mesh.position.y}, Z: ${mesh.position.z}`;
  console.log(...mesh.position);
  inpRngs.forEach((rng) => {
    const cls = rng.classList[0];
    const p = mesh.position[cls] as number;
    rng.value = String((p + 1) * 50);
    rng.addEventListener("input", (e: Event) => {
      (mesh.position as any)[rng.classList[0]] =
        +(e.target as HTMLInputElement).value * 0.02 - 1;
      cordsInfo.innerText = `X: ${Math.floor(mesh.position.x * 10000) / 10000
        }, Y: ${Math.floor(mesh.position.y * 10000) / 10000}, Z: ${Math.floor(mesh.position.z * 10000) / 10000
        }`;
    });
  });
}; // Ahhh, do not check this function, typescript, pls...

const cngMshrot = function (mesh: THREE.Mesh | THREE.Line) {
  cordsInfo.innerText = `X: ${mesh.rotation.x}, Y: ${mesh.rotation.y}, Z: ${mesh.rotation.z}`;
  console.log(...mesh.rotation);
  inpRngs.forEach((rng) => {
    const cls = rng.classList[0];
    const p = mesh.rotation[cls] as number;
    rng.value = String((p + 1) * 50);
    rng.addEventListener("input", (e: Event) => {
      (mesh.rotation as any)[rng.classList[0]] =
        +(e.target as HTMLInputElement).value * 0.02 - 1;
      cordsInfo.innerText = `X: ${Math.floor(mesh.rotation.x * 10000) / 10000
        }, Y: ${Math.floor(mesh.rotation.y * 10000) / 10000}, Z: ${Math.floor(mesh.rotation.z * 10000) / 10000
        }`;
    });
  });
}; // TODO: function that can rotate the mesh, it`s not done yet! it consist of some mistakes

const mainTl = gsap.timeline({ defaults: { duration: 2 } }); // duration 2
const mainPos: nmbrX3 = [-0.9012, 0.4558, -0.3452]; // Uzbekistan (main position)
// console.log(...mainPos);
// console.log(...mathArray(mainPos, [0.0020, 0.1553, 0], EmathOp.add));
// -0.9032 0.3005 -0.3452

const fontLoad = new FontLoader();

function crtText(data: DataText) {
  const font = data.font ? data.font : "./assets/fonts/font-roboto.json";
  let {
    text,
    pos,
    rot,
    size,
    color = 0xffffff,
    height = 0.004,
    curve = 2,
    parent = false,
    event,
  } = data;
  return new Promise((resolve) => {
    fontLoad.load(font, (font) => {
      const textMesh = new THREE.Mesh(
        new TextGeometry(text, {
          font: font,
          size: size,
          height: height,
          curveSegments: curve,
        }),
        new THREE.MeshBasicMaterial({
          color: color,
          side: THREE.FrontSide,
        })
      );
      if (pos) textMesh.position.set(...pos);
      if (rot) textMesh.rotation.set(...rot);
      scene.add(textMesh);
      if (parent) (parent as Parent).add(textMesh);
      if (event) {
        interactionManager.add(textMesh);
        textMesh.addEventListener("click", (ev) => event!(ev, textMesh));
      }
      resolve(textMesh);
    });
  });
}

interface DataText {
  text: string;
  pos: nmbrX3;
  rot: nmbrX3;
  size: number;
  parent?: Parent;
  color?: string | number;
  font?: string;
  height?: number;
  curve?: number;
  event?: (event: THREE.Event, mesh: TextMesh) => void;
}

type TextMesh = THREE.Mesh<TextGeometry, THREE.MeshBasicMaterial>;

const txrLoad = new THREE.TextureLoader();

function crtImg(data: DataImg) {
  const { imgSrc, size, pos, rot, alpha = 0.5, parent = false, event } = data;
  const texture = txrLoad.load(imgSrc);
  const meshTxr = new THREE.Mesh(
    new THREE.PlaneGeometry(...size),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      alphaTest: alpha,
    })
  );
  if (pos) meshTxr.position.set(...pos);
  if (rot) meshTxr.rotation.set(...rot);
  scene.add(meshTxr);
  if (parent) parent.add(meshTxr);

  if (event) {
    interactionManager.add(meshTxr);
    meshTxr.addEventListener("click", (e) => event(e, meshTxr));
  }

  return meshTxr;
}

type ImgMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

interface DataImg {
  imgSrc: string;
  size: [number, number];
  pos: nmbrX3;
  rot: nmbrX3;
  parent?: Parent;
  alpha?: number;
  event?: (event: Event, mesh: TextMesh) => void;
}

const dataImg: DataImg = {
  imgSrc: "assets/images/pine-tree.png",
  size: [0.235, 0.235],
  pos: [-0.9552, 0.6326, -0.1938],
  rot: [0, -1.85, 0],
  parent,
  event: (event, mesh) => {
    cngMshpos(mesh);
    console.log("img");
  },
};

const imgLoad: THREE.ImageLoader = new THREE.ImageLoader();

const mapIMG = "./images/map(1).png";
function drawXYcords(xy: string | number[]) {
  if (typeof xy === "string") {
    const loader = new THREE.TextureLoader();
    console.log("flasdjflkasdjfksadjf");
    // load a resource
    loader.load(
      mapIMG,
      function (texture) {
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          alphaTest: 0.5,
        });
        const meshTexture = new THREE.Mesh(
          new THREE.PlaneGeometry(0.235, 0.235),
          material
        );
        meshTexture.position.set(0.62, 1, -0.37);
        meshTexture.rotation.set(0, 1.95, 0);
        meshTexture.scale.set(0, 0, 0);
        scene.add(meshTexture);
        parent.add(meshTexture);
        // anime({ targets: meshTexture.scale, x: [0, .7], y: [0, .7], z: [0, 1], duration: 600, easing: 'linear' })
      },
      undefined,
      function (e) {
        console.error(e);
      }
    );

    /* \ !!!WARN!!! Planet 2-4 */

    /* !!!WARN!!! Planet 2-5 */
    // Массив точек для «бум» — это в след. уроках..
    const circlePointsAr = [
      //(main)
      [0.662, 0.775, -0.28],
      [0.63, 0.84, -0.13], //lux
      [0.89, 0.55, -0.2139],
      [0.54, 0.75, 0.5], //Lond
      [-0.2138805, 0.773827135, 0.692131996], //usa 2
      [-0.7738271, 0.69213199, 0.21388055], //usa
      [0.25, 0.33, -0.968], //hong
      [0.53, -0.02, -0.92],
    ];

    let meshCircles = null; // Переменная для самой карты
    /* Строим саму карту планеты из «кружочков» */
    interface MainObj {
      w: number;
      h: number;
      d: Document;
      c: HTMLCanvasElement;
      cnt: CanvasRenderingContext2D;
      s: HTMLStyleElement;
      img: HTMLImageElement;
      data: ImageData | any;
      ar: [] | [number[]] | any;
      nAr: [];
      counter: number;
      counter2: number;
      prewLatX: number;
    }
    const obj: MainObj = {}; // Создадим объект, чтобы в него «складывать» переменные
    obj.w = 360; // Обозначим кратную размеру map.png ширину будущего canvas
    obj.h = 180; // ~ высоту ~
    obj.d = document; // Для псевдонима document (чтобы каждый раз его не писать)
    obj.c = obj.d.createElement("canvas"); // Создание canvas, в который будем помещать точки из PNG изображения и брать их для нашей карты планеты
    obj.cnt = obj.c.getContext("2d") as CanvasRenderingContext2D; // Установим контекст 2d, а не webgl
    obj.c.width = obj.w; // Ширина canvas
    obj.c.height = obj.h; // Высота ~
    obj.c.classList.add("tmpCanvas"); // Добавим класс для нового объекта canvas в HTML коде страницы, чтобы обратиться к нему далее
    obj.d.body.appendChild(obj.c); // Добавим его в документ

    obj.s = obj.d.createElement("style"); // Создадим стиль
    obj.s.innerText = `.tmpCanvas{position:absolute;z-index:-9;width:0;height:0;overflow:hidden}`; // Сам CSS-код позиционирования нового canvas — скрываем его с глаз
    obj.d.body.appendChild(obj.s); // Добавляем стили в document
    obj.img = new Image(); // Создадим объект класса Image (нативный JS)
    obj.img.src = mapIMG; // Присвоем ему путь к изображению
    obj.img.onload = () => {
      // Когда загрузится... выполним код ниже
      obj.cnt.drawImage(obj.img, 0, 0, obj.w, obj.h); // Нарисуем изображение на canvas из PNG файла
      obj.data = obj.cnt.getImageData(0, 0, obj.w, obj.h);
      obj.data = obj.data.data; // Возьмём точки из canvas
      obj.ar = [];
      // ** Код ниже для shader (для будущих уроков)
      const impacts = [];
      for (let i = 0; i < circlePointsAr.length; i++) {
        impacts.push({
          impactPosition: new THREE.Vector3(
            circlePointsAr[i][0],
            circlePointsAr[i][1],
            circlePointsAr[i][2]
          ),
          impactMaxRadius: 0.0001 + Math.random() * 0.0002,
          impactRatio: 0.01,
        });
      }
      let uniforms = {
        impacts: { value: impacts },
      };
      // \ **

      // Важный код. Наполним массив точками из данных из canvas
      for (let y = 0; y < obj.w; y++) {
        // по оси Y
        for (let x = 0; x < obj.w; x++) {
          // по оси X
          const a = obj.data[(obj.w * y + x) * 4 + 3]; // берём только n-нные значения
          if (a > 200) {
            obj.ar.push([x - obj.w, y - obj.w / 6.2]); // здесь 6.2 — это как бы «отступ от севера»
          }
        }
      }
      // https://r105.threejsfundamentals.org/threejs/lessons/threejs-optimize-lots-of-objects.html
      // RU: https://stepik.org/lesson/582241/step/1?unit=576975
      const lonHelper = new THREE.Object3D();
      scene.add(lonHelper);
      // We rotate the latHelper on its X axis to the latitude
      const latHelper = new THREE.Object3D();
      lonHelper.add(latHelper);
      // The position helper moves the object to the edge of the sphere
      const positionHelper = new THREE.Object3D();
      positionHelper.position.z = 0.5;
      // positionHelper.position.z = Math.random();
      latHelper.add(positionHelper);
      // Used to move the center of the cube so it scales from the position Z axis
      const originHelper = new THREE.Object3D();
      originHelper.position.z = 0.5;
      positionHelper.add(originHelper);
      const lonFudge = Math.PI * 0.5;
      const latFudge = Math.PI * -0.135;
      const geometries: THREE.PlaneGeometry[] = [];

      obj.nAr = [];
      obj.counter = 0;
      obj.counter2 = 0;

      // Материал с шейдером, который поможет скруглить PlaneBufferGeometry и анимировать, сделать «бум»
      let materialCircles = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.FrontSide,
        onBeforeCompile: (shader: THREE.Shader) => {
          shader.uniforms.impacts = uniforms.impacts;
          shader.vertexShader = `
          struct impact {
            vec3 impactPosition;
            float impactMaxRadius;
            float impactRatio;
          };
          uniform impact impacts[${circlePointsAr.length}];
          attribute vec3 center;
          ${shader.vertexShader}
        `.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
          float finalStep = 0.0;
          for (int i = 0; i < ${circlePointsAr.length};i++){
  
            float dist = distance(center, impacts[i].impactPosition);
            float curRadius = impacts[i].impactMaxRadius * impacts[i].impactRatio/2.;
            float sstep = smoothstep(0., curRadius*1.8, dist) - smoothstep(curRadius - ( .8 * impacts[i].impactRatio ), curRadius, dist);
            sstep *= 1. - impacts[i].impactRatio;
            finalStep += sstep;
  
          }
          finalStep = clamp(finalStep*.5, 0., 1.);
          transformed += normal * finalStep * 0.25;
          `
          );
          //console.log(shader.vertexShader);
          // Этот кусочек кода отвечает за «цветовой» шейдер, который и будет скруглять наш PlaneBufferGeometry
          shader.fragmentShader = shader.fragmentShader.replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `
          if (length(vUv - 0.5) > 0.5) discard;
          vec4 diffuseColor = vec4( vec3(.7,.7,.7), .1 );
          `
          );
        },
      });
      materialCircles.defines = { USE_UV: "" };

      let uty0 = 0;
      // Проходимся по массиву наших точек («кружочков»)
      obj.ar.map((e: number[]) => {
        uty0++;
        obj.counter2++;
        const geometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(
          0.005,
          0.005
        );
        // Позиционирование «кружочков»
        // +15 — вращаем на 15 градусов западнее, хотя это можно было сделать иначе — вращать уже весь объект, а не каждый из «кружочков»
        // degToRad — https://threejs.org/docs/#api/en/math/MathUtils.degToRad
        lonHelper.rotation.y = THREE.MathUtils.degToRad(e[0]) + lonFudge + 15;
        const w = (latHelper.rotation.x =
          THREE.MathUtils.degToRad(e[1]) + latFudge);
        if (w - obj.prewLatX === 0 /*&&obj.counter2%2==0*/) {
          originHelper.updateWorldMatrix(true, false); // ЭТА
          geometry.applyMatrix4(originHelper.matrixWorld); // и ЭТА штуки необходимы для обновления позиции отдельного «кружочка»
          // Код ниже для анимирования «бум»
          geometry.setAttribute(
            "center",
            new THREE.Float32BufferAttribute(
              geometry.attributes.position.array,
              3
            )
          );
          // Добавим вновь созданный «кружочек» в массив
          geometries.push(geometry);
        }
        obj.prewLatX = w;
      });
      //Сформируем лишь одну буферную геометрию (которая по-идее должна обрабатываться на видео карте)
      //из массива ранее сформированных «кружочков»
      const geometryCircles = BufferGeometryUtils.mergeGeometries(
        geometries,
        false
      );

      meshCircles = new THREE.Mesh(geometryCircles, materialCircles);
      // ниже тестовый материал, чтобы можно было увидеть НЕ «кружочки», а реальные PlaneBufferGeometry
      //meshCircles = new THREE.Mesh(geometryCircles, new THREE.MeshBasicMaterial({color:0xffffff}));

      // Добавим на сцену наш новый объект (саму карту)
      scene.add(meshCircles);

      //Добавим новый объект (саму карту) к родительскому элементу
      parent.add(meshCircles);

      // Немного увеличим наш новый объект, чтобы все «кружочки» были над поверхностью планеты
      meshCircles.scale.set(1.051, 1.051, 1.051);

      obj.c.remove(); // Удалим временный canvas из которого брали точки
      obj.s.remove(); // Удалим временные стили
    };
  } else {
    let c = [];
    const geos = [];
    const mat = new THREE.ShaderMaterial({
      side: THREE.FrontSide,
      vertexShader: `
        varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
      fragmentShader: `
          varying vec2 vUv;
          
          void main() {
            float radius = 0.5; // Радиус круга
            vec2 center = vec2(0.5, 0.5); // Координаты центра круга
            
            float distance = length(vUv - center);
            
            if (distance > radius) {
              discard; // Отбросить фрагмент, если он находится за пределами круга
            }
            
            gl_FragColor = vec4(1.0); // Цвет круга
          }
        `,
    });
    /* const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.BackSide
      }); */
    // 29192
    for (let i = 0; i < 29192; i++) {
      const n = xy[i];
      c.push(n);

      if (c.length === 2) {
        const lt = THREE.MathUtils.degToRad(c[1]);
        const ln = THREE.MathUtils.degToRad(c[0]);
        const phi = Math.PI / 1.7 - lt;
        const theta = 2 * Math.PI - ln;

        // const geo = new THREE.SphereGeometry(0.0025, 3, 3);
        const geo = new THREE.PlaneGeometry(0.005, 0.005, 1, 1);
        const m = new THREE.Mesh(geo, mat);
        m.position.setFromSphericalCoords(1.06, phi, theta);
        m.lookAt(...parent.position.toArray());
        m.lookAt(...parent.position.toArray());
        geo.applyMatrix4(m.matrixWorld); // Применяем матрицу меша к геометрии

        geos.push(geo);
        c.length = 0;
      }
    }
    const mg = BufferGeometryUtils.mergeGeometries(geos, false);

    const ms = new THREE.Mesh(mg, mat).rotateZ(Math.PI); // here i rotatee points (front side) to center of sphere
    ms.material.side = THREE.BackSide; // then i shew only back side of points, because the front side is looking at the center of the sphere

    scene.add(ms);
    return ms;
  }
}
// const dotsMeshGroup = drawXYcords(mapIMG);
const dotsMeshGroup = drawXYcords(dotsSphere);
// console.log(dotsMeshGroup);

const vecToArrPos = (c: THREE.Vector3[]) => {
  const r = []; // result
  for (let i = 0; i < c.length - 1; i++) {
    const s = c[i]; // start
    const e = c[i + 1]; // end
    r.push(s.x, s.y, s.z);
    r.push(e.x, e.y, e.z);
  }
  return r as nmbrX3;
}

const arrToVec = (a: nmbrX3) => {
  return new THREE.Vector3(a[0], a[1], a[2])
}

type LineMesh = THREE.Line<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  THREE.LineBasicMaterial
>;
interface DataLine {
  from?: nmbrX3;
  to?: nmbrX3;
  middle?: nmbrX3;
  color?: number;
  width?: number;
  dashOffset?: number;
  dashArray?: number;
  dashRatio?: number;
  length?: number;
  animation?: boolean;
  event?: (event: Event, mesh: LineMesh) => void;
}

function crtLines(data: DataLine) {
  const { from, to, middle, color, width, animation, length, dashArray, dashOffset, dashRatio, event } = data;

  function crtCurve(cords: { [n: string]: number[] }) {
    const { f, t, m } = cords;

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...f),
      new THREE.Vector3(...m),
      new THREE.Vector3(...t)
    );
    return curve.getPoints(24);
  }

  // let color = new THREE.Color(.2, THREE.MathUtils.randFloat(.5, .8), 1);
  // let color=new THREE.Color(1,getRandomFloat(.5,1.),1);
  // let color=new THREE.Color(.2,.7,1);
  // let color=new THREE.Color(.2,getRandomFloat(.5,.8),1);
  // Здесь я делаю цвета линий немного разными, чтобы разнообразить их
  // if (flat) {// это линии, которые белые — летят из нашего центра в другие стороны, в отличии от синих линий, которые летят К ЦЕНТРУ (нашему условному центру)
  //   dashRatio = .9
  //   lineWidth = .003
  // }


  const f = from || mainPos || [0, -1.5, 0];
  const t = to || [0, 1.5, 0];

  const midPoint = new THREE.Vector3();
  midPoint.addVectors(arrToVec(f), arrToVec(t)).multiplyScalar(0.7);

  const m = middle || midPoint /* ?? new THREE.Vector3(t[0] + 0.5, t[1] + 0.5, t[2]) */ // ?? mathArray(from || [...parent.position], to, EmathOp.add, 3)

  const allCords = crtCurve({ f, t, m });
  const cords = [...allCords];

  if (length) {
    const dShz = length > 20 ? 10 : length < 0.8 ? 0.8 : length;
    cords.length = Math.floor(dShz * 2.5); // 144
  }

  let lineMesh: THREE.Mesh<any, any> | THREE.Line<any, any>;
  if (width) { // line geometry by @lume, three.meshline, another non-official library that can draw mesh lines (it`s newer than the library in the video) (https://github.com/lume/three-meshline))
    const geo = new MeshLineGeometry();
    geo.setPoints(vecToArrPos(cords) as number[]);
    lineMesh = new MeshLine(geo, new MeshLineMaterial({
      transparent: true, // Необходимо, чтобы была видна анимация, если false, то линия просто будет залита определённым цветом и не будет видна анимация
      lineWidth: width || 1,
      color: new THREE.Color(color || 0xffffff),
      dashArray: dashArray || 2, // всегда должен быть
      dashOffset: dashOffset || 0, // начать с dash к zero
      dashRatio: dashRatio || 0.5, // видимая минута ряда длины. Мин: 0.5, Макс: 0.99
    } as ShaderMaterialParameters & MeshLineMaterial));// Создаём саму линию (Mesh)
  } else {
    lineMesh = new THREE.Line( // if you want to create a gl.line that can not be resized (width) or animated with dashOffset, dashRatio and dashArray
      new THREE.BufferGeometry().setFromPoints(cords as THREE.Vector3[]),
      new THREE.LineBasicMaterial({
        transparent: true,
        color: color || 0xffffff,
        side: THREE.DoubleSide,
      })
    );
  }

  // dashArray: 2, // всегда должен быть
  // dashOffset: 0, // начать с dash к zero
  // dashRatio, // видимая минута ряда длины. Мин: 0.99, Макс: 0.5
  //line.materiall.uniforms.dashOffset.value -= 0.01;
  scene.add(lineMesh);
  parent.add(lineMesh);

  if (event) {
    interactionManager.add(lineMesh);
    lineMesh.addEventListener("click", (ev) => event(ev, lineMesh));
  }

  if (animation) {
    function update() {
      lineMesh.material.uniforms.dashOffset.value -= 0.01;
      requestAnimationFrame(update);
    }
    update()

    // here i tried without dashOffset
    /* feel pain, accept pain and know pain...
    // Loop through the positions array and add animation tweens to the timeline
    // const tlN = gsap.timeline({ repeat: Infinity, defaults: { duration: 12 } });
    // const tlN2 = gsap.timeline({ repeat: Infinity });
    // const p1 = arrToVec(mathArray(middle, from, EmathOp.min));
    // const p2 = arrToVec(mathArray(to, from, EmathOp.min)); // X: -0.6418, Y: 0.8424, Z: -0.6858
    // console.log(p1, p2);
    // tlN.to(lineMesh.rotation, { x: -0.2788, y: -0.5242, z: -0.6758, delay: 0, ease: 'power0', duration: 11 })
    // setInterval(() => tlN.restart(), 12);
    // tlN2.to(lineMesh.position, { x: 0.073631, y: 0.099817, z: -0.109992, duration: 6, ease: 'power0' });
    // tlN2.to(lineMesh.position, { ...p2, duration: 6, ease: 'power0' });
    // setTimeout(function() {
    //   tlN2.pause();
    // }, 3000);
    /* allCords.forEach((ob: THREE.Vector3, i: number) => {
      console.log(i);
        const p = arrToVec(mathArray([...ob], from, EmathOp.min, 3) as nmbrX3);
        tlN2.to(lineMesh.position, { ...p, delay: 0, duration: 0.5, ease: 'power0' });
        console.log(p);
        // if (i == allCords -1) lineMesh.material.uniforms.dashOffset.value = 1;
    }); */
    // tlN.to(lineMesh.position, { x: 0.885, y: 0.323, z: -0.344, duration: 1, delay: 0, ease: 'power0' }, 24); */
  }

  return lineMesh;
};

const mainPointTextImg = async () => {
  const dataPoint: DataPoint = {
    main: true, // color
    position1: mathArray(mainPos, [0.0020, 0.1553, 0], EmathOp.add) as nmbrX3, // position of cylinderBody
    position2: mainPos, // position of cylinderBase
    geometry1: [0.004, 0.004, 0.3, 12], // geometry of cylinderBody
    geometry2: [0.02, 24, 0, 10], // geometry of cylinderBase
    /* event1: (event, mesh: CylinderBody) => {
      cngMshpos(mesh);
      console.log("body");
    },
    event2: (event, mesh: CylinderBase) => {
      cngMshpos(mesh);
      console.log("base");
    }, */
  };
  const mapPoint = crtPoint(dataPoint);

  mainTl.fromTo(
    mapPoint.base.scale,
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1, ease: "power1.out", delay: 0.4 }
  );
  mainTl.fromTo(
    mapPoint.body.scale,
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1, ease: "power1.out", delay: 0.4 }
  );


  const dataText: DataText = {
    text: "One",
    pos: [-0.9266, 0.6378, -0.2552],
    rot: [0, -1.85, 0],
    size: 0.05,
    parent,
    event: (event, mesh: TextMesh) => {
      cngMshpos(mesh);
      console.log("text");
    },
  };
  const dataText2: DataText = {
    text: "Test",
    pos: [-0.9266, 0.5278, -0.2552],
    rot: [0, -1.85, 0],
    size: 0.05,
    color: 0x84b3df,
    parent,
  };

  const text1 = (await crtText(dataText)) as TextMesh;
  const text2 = (await crtText(dataText2)) as TextMesh;
  // console.log(text1, text2);

  mainTl.fromTo(
    text1.scale,
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1, ease: "power1.out", delay: 0.1, duration: 1 }, 5
  );
  mainTl.fromTo(
    text2.scale,
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1, ease: "power1.out", duration: 1 }, 5.5
  );

  const imgMesh = crtImg(dataImg);
  mainTl.fromTo(
    imgMesh.scale,
    { x: 0, y: 0, z: 0 },
    { x: 0.7, y: 0.7, z: 1, ease: "power1.out", duration: 1 }, 6
  );
};
mainPointTextImg();

interface IallDataArr {
  [key: string]: {
    main: boolean;
    cords: { from: nmbrX3, to: nmbrX3, middle: nmbrX3 };
  }
}

const allDataArr: nmbrX3[] = [
  [0.0329, 0.647, -0.8432], // London
  [-0.5284, 0.6614, -0.6456], // Moscow
  [-0.6562, 0.3793, 0.7484], // Tokio
  [-1, 0.2292, -0.2822], // New-Delhi
  [0.9618, 0.4299, -0.2006], // Washington
  [-0.135, 0.7684, -0.7336], // Oslo
];

interface IallMshs {
  point: {
    body: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
    base: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  },
  line: THREE.Mesh<any, any> | THREE.Line<any, any>
}

const allMshs: IallMshs[] = [];
allDataArr.forEach((cord, i) => {
  allMshs.push({
    line: crtLines({
      from: mainPos as nmbrX3,
      to: cord, // X: -0.166, Y: 0.7008, Z: -0.67
      // middle: [-0.6454, 0.8175, -0.7008],
      width: 0.007,
      dashOffset: -0.1,
      dashArray: 2,
      dashRatio: 0.85,
      animation: true,
    }),
    point: crtPoint({
      position1: mathArray(cord, [0.0020, 0.113, 0], EmathOp.add) as nmbrX3,
      // [0.0020, 0.113, 0] is a difference between body and base positions
      position2: cord,
    })
  });
  mainTl.fromTo(
    allMshs[i].point.base.scale,
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1, ease: "power1.out", delay: 0 }, 2
  );
  mainTl.fromTo(
    allMshs[i].point.body.scale,
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1, ease: "power1.out", delay: 0 }, 3
  );
  mainTl.fromTo(
    allMshs[i].line.scale,
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1, ease: "power1.out", delay: 0 }, 4.2
  )
});

const timer = () => {
  const timeHtml = document.querySelector('.time') as HTMLParagraphElement;
  let tO = 0; // time old
  setInterval(() => { timeHtml.innerText = tO >= 9 ? '' + ++tO : '0' + ++tO }, 1000)
};
timer();

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// And render events here
function render() {
  // lightGroup.rotation.y = time * (10 * Math.PI / 180) * 2;
  // parent.rotation.y = -(new Date().getSeconds() * ((10 * Math.PI) / 180));
  // console.log(camera.position); // Vector3 {x: 1.311504434817275, y: 9.70059610982433, z: 6.370901916645389}
  // {x: x + 10.4, y: y + 4, z: z -3.5}
  lightGroup.position.copy(camera.position);
  // console.log(meshLine.position)
  controls.update();
  interactionManager.update(); // to add event listener to mesh objects
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

render();
