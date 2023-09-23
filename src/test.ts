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
// console.log(dotsSphere.length); // 29192
import { InteractionManager } from "three.interactive";
// to add event listener to mesh objects, i love this library (*-*)
// import * as meshLine from 'three.meshline/src/THREE.MeshLine.js';
// meshlines library: https://www.npmjs.com/package/three.meshline

// how to get cords of planeGeometries (dots) for sphere from any image:
// you need two things: the image (that we will use for filling with dots) and the function that can do this magic
// the amount of dots` cords depends on the size of the image and function,
// so i recommend to use size 240x120 (pixels) or over if you want high quality.
// what about the function that can get cords, you can get from the video (you know what i am talking about)
// so you can take the cords just put something to collect (maybe array) it in:
/* for (let y = 0; y < obj.w; y++) {// по оси Y
            for (let x = 0; x < obj.w; x++) {// по оси X
                const a = obj.data[((obj.w * y) + x) * 4 + 3];// берём только n-нные значения
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

const canvas = document.querySelector(".globus") as HTMLCanvasElement; // to show the webgl result in html DOM
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

const geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3(-10, 0, 0));
geometry.vertices.push(new THREE.Vector3(10, 0, 0));

// Создание материала линии
const material = new THREE.LineDashedMaterial({
  color: 0x0000ff,
  dashSize: 2,
  gapSize: 2,
  scale: 1
});

// Создание объекта линии
const line = new THREE.Line(geometry, material);
line.computeLineDistances(); // Обязательно вызовите этот метод для корректного отображения пунктира

// Добавление линии в сцену
scene.add(line);

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
