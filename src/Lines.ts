import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { zebraPoints } from './ZebraPoints.ts'
// console.log(bmwPoints);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 60);
camera.position.set(0, 0, 50);
camera.lookAt(0, 0, 0);

const scene = new THREE.Scene();
// Next thing we will do is define a material. For lines we have to use LineBasicMaterial or LineDashedMaterial.

const controls = new OrbitControls(camera, renderer.domElement); // controls
controls.enableDamping = true;
controls.enablePan = true;

//create a blue LineBasicMaterial
const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
// After material we will need a geometry with some vertices:

const cord = [];
const vectors: THREE.Vector3[] = [];

for (let i = 0; i < zebraPoints.length; i++) {
    cord.push(zebraPoints[i])
    if (cord.length === 3) {
        const c = new THREE.Vector3(...cord);
        vectors.push(c);
        cord.length = 0;
    };

};
console.log(vectors);

const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
// Note that lines are drawn between each consecutive pair of vertices, but not between the first and last (the line is not closed.)

// Now that we have points for two lines and a material, we can put them together to form a line.

const line = new THREE.Line(geometry, material);
// All that's left is to add it to the scene and call render.

scene.add(line);
renderer.render(scene, camera);

console.log(line);

const loader = new GLTFLoader();
const allDots: THREE.Vector3[] = [];

// Загружаем модель
/* loader.load('../assets/3D/zebra.glb',
    function (gltf) {
        // Получаем сцену из загруженного файла
        const scene = gltf.scene;

        // Проходимся по всем объектам в сцене
        scene.traverse(function (object) {
            // Если объект имеет геометрию
            if (object.isMesh) {
                const geometry = object.geometry;

                // Получаем все точки геометрии
                const vertices = geometry.attributes.position.array;

                // Проходимся по массиву точек (x, y, z)
                for (let i = 0; i < vertices.length; i += 3) {
                    const x = vertices[i];
                    const y = vertices[i + 1];
                    const z = vertices[i + 2];

                    // Создаем Vector3 из координат и делаем с ним что-то
                    // const vector3 = new THREE.Vector3(x, y, z);
                    // allDots.push( `[${Math.floor(x * 1000) / 1000}, ${Math.floor(y * 1000) / 1000}, ${Math.floor(z * 1000) / 1000}]`);
                    allDots.push( [Math.floor(x * 1000) / 1000, Math.floor(y * 1000) / 1000, Math.floor(z * 1000) / 1000]);

                    // Делаем что-то с vector3
                    // ...
                }
            }
        })
        console.log(allDots.toLocaleString());
    }
); */

function render() {
    // lightGroup.rotation.y = time * (10 * Math.PI / 180) * 2;
    // parent.rotation.y = -(time * ((10 * Math.PI) / 180));
    // console.log(camera.position); // Vector3 {x: 1.311504434817275, y: 9.70059610982433, z: 6.370901916645389}
    // {x: x + 10.4, y: y + 4, z: z -3.5}
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

render();