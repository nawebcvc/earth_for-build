import canvasSketch from "canvas-sketch";
import * as THREE from "three";
import { OrbitControls } from "./OrbitControls.js";
import gsap from "gsap";
import { FontLoader } from './FontLoader.js';
import { TextGeometry } from "./TextGeometry.js";
import { BufferGeometryUtils, mergeGeometries } from './BufferGeometryUtils.js';
import { dotsSphere } from './SpherePoints.js'
// console.log(dotsSphere);

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA6
  attributes: { antialias: true },
};

const sketch = async ({ context }) => {
  const renderer = new THREE.WebGLRenderer({
    context,
  });

  renderer.setClearColor("#000", 1);
  // const camera = new THREE.PerspectiveCamera(12, window.innerWidth / window.innerHeight, 10, 11.4);
  const camera = new THREE.PerspectiveCamera(12, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(10.4, 4, -3.5);
  camera.setViewOffset(10, 10, -2, 0.5, 9, 9);

  const controls = new OrbitControls(camera, context.canvas);
  controls.enableDamping = true;
  controls.enablePan = false;

  const scene = new THREE.Scene();

  const lightGroup = new THREE.Object3D();
  const alight = new THREE.DirectionalLight(0xffffff, 2);
  alight.position.set(-1.5, 1.7, 0.7);
  lightGroup.add(alight);
  const alight2 = new THREE.DirectionalLight(0xffffff, 2);
  alight.position.set(-1.5, 0.3, 0.7);
  lightGroup.add(alight2);

  // const txrLoad = new THREE.TextureLoader();
  // const imgTexture = txrLoad.load('./images/worldMAP/10.png');
  // color: new THREE.Color(0x091e5a)
  const parent = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 2),
    new THREE.MeshBasicMaterial({ opacity: 1, transparent: true })
  );
  const meshHide = new THREE.Mesh(
    new THREE.SphereGeometry(1.0499, 64, 36),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(0x091e5a) })
    // new THREE.MeshStandardMaterial({ map: imgTexture })
  );

  scene.add(parent);
  scene.add(meshHide);
  scene.add(lightGroup);

  function crtPoint(data) {
    const { main, position1, position2, geometry1, geometry2 } = data;
    const color = main ? 0x86c3f9 : 0x008dfb;

    const cylinderBody = new THREE.Mesh(
      new THREE.CylinderGeometry(...geometry1),
      new THREE.MeshBasicMaterial({ color: color })
    );
    cylinderBody.position.set(...position1);
    scene.add(cylinderBody);
    parent.add(cylinderBody);

    const cylinderBase = new THREE.Mesh(
      new THREE.CircleGeometry(...geometry2),
      new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide
      })
    );
    cylinderBase.position.set(...position2);
    cylinderBase.lookAt(new THREE.Vector3);
    scene.add(cylinderBase);
    parent.add(cylinderBase);

    return { body: cylinderBody, base: cylinderBase };
  }; // create point in the scene

  const dataPoint = {
    main: true, // color
    position1: [.66, .95, -.28], // position of cylinderBody
    position2: [.662, .8, -.28], // position of cylinderBase
    geometry1: [0.004, 0.004, 0.3, 12], // geometry of cylinderBody
    geometry2: [0.02, 24, 0, 10], // geometry of cylinderBase
  };
  const mapPoint = crtPoint(dataPoint);

  const tl = gsap.timeline({ defaults: { duration: 2 } });
  tl.fromTo(mapPoint.base.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, ease: "power1.out", delay: 0.4 });
  tl.fromTo(mapPoint.body.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, ease: "power1.out", delay: 0.4 });
  const fontLoad = new FontLoader();

  function crtText(data) {
    const font = data.font ? data.font : './fonts/font-roboto.json';
    let { text, pos, rot, size, color = 0xffffff, height = .004, curve = 2, parent = false } = data;
    return new Promise((resolve, reject) => {
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
            side: THREE.FrontSide
          })
        );
        if (pos) textMesh.position.set(...pos);
        if (rot) textMesh.rotation.set(...rot);
        scene.add(textMesh);
        if (parent) parent.add(textMesh);

        resolve(textMesh);
      });
    });
  };

  const dataText = {
    text: 'One', pos: [0.64, 1, -.3], rot: [0, 1.95, 0], size: .05, parent
  };
  const dataText2 = {
    text: 'Test', pos: [.64, .89, -.3], rot: [0, 1.95, 0], size: .05, color: 0x84b3df, parent
  };

  const text1 = await crtText(dataText);
  const text2 = await crtText(dataText2);
  // console.log(text1, text2);

  tl.fromTo(text1.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, ease: "power1.out", delay: 0.1, duration: 1 });
  tl.fromTo(text2.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, ease: "power1.out", duration: 1 });

  const txrLoad = new THREE.TextureLoader();

  function crtImg(data) {
    const { imgSrc, size, pos, rot, alpha = .5, parent = false } = data;
    return new Promise((resolve, reject) => {
      txrLoad.load(
        imgSrc, (texture) => {
          const meshTxr = new THREE.Mesh(
            new THREE.PlaneGeometry(...size),
            new THREE.MeshBasicMaterial({
              map: texture,
              side: THREE.DoubleSide,
              alphaTest: alpha
            })
          );
          if (pos) meshTxr.position.set(...pos);
          if (rot) meshTxr.rotation.set(...rot);
          scene.add(meshTxr);
          if (parent) parent.add(meshTxr);
          resolve(meshTxr)
          reject((err) => { console.log(err) })
        }
      )
    })
  };

  const dataImg = {
    imgSrc: 'images/pine-tree.png',
    size: [.235, .235],
    pos: [.62, 1, -.37],
    rot: [0, 1.95, 0],
    parent
  };

  const imgMesh = await crtImg(dataImg);
  tl.fromTo(imgMesh.scale, { x: 0, y: 0, z: 0 }, { x: .7, y: .7, z: 1, ease: "power1.out", duration: 1 });

  const imgLoad = new THREE.ImageLoader();
  const dotGroup = new THREE.Group();

  const mapIMG = './images/map(1).png';
  function drawXYcords(xy, g) {
    if (typeof xy === "string") {
      const loader = new THREE.TextureLoader();
      console.log('flasdjflkasdjfksadjf');
      // load a resource
      loader.load(
        mapIMG,
        function (texture) {
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            alphaTest: .5
          });
          const meshTexture = new THREE.Mesh(
            new THREE.PlaneGeometry(.235, .235),
            material
          );
          meshTexture.position.set(.62, 1, -.37);
          meshTexture.rotation.set(0, 1.95, 0);
          meshTexture.scale.set(0, 0, 0);
          scene.add(meshTexture)
          parent.add(meshTexture)
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
        [.662, .775, -.28],
        [.63, .84, -.13],//lux
        [.89, .55, -.2139],
        [.54, .75, .5],//Lond
        [-.2138805, .773827135, .692131996],//usa 2
        [-.7738271, .69213199, .21388055],//usa
        [.25, .33, -.968],//hong
        [.53, -.02, -.92]
      ];

      let meshCircles = null; // Переменная для самой карты
      /* Строим саму карту планеты из «кружочков» */
      const obj = {};// Создадим объект, чтобы в него «складывать» переменные
      obj.w = 360;// Обозначим кратную размеру map.png ширину будущего canvas
      obj.h = 180;// ~ высоту ~
      obj.d = document;// Для псевдонима document (чтобы каждый раз его не писать)
      obj.c = obj.d.createElement('canvas');// Создание canvas, в который будем помещать точки из PNG изображения и брать их для нашей карты планеты
      obj.cnt = obj.c.getContext('2d');// Установим контекст 2d, а не webgl
      obj.c.width = obj.w;// Ширина canvas
      obj.c.height = obj.h;// Высота ~
      obj.c.classList.add('tmpCanvas');// Добавим класс для нового объекта canvas в HTML коде страницы, чтобы обратиться к нему далее
      obj.d.body.appendChild(obj.c);// Добавим его в документ

      obj.s = obj.d.createElement('style');// Создадим стиль
      obj.s.innerText = `.tmpCanvas{position:absolute;z-index:-9;width:0;height:0;overflow:hidden}`;// Сам CSS-код позиционирования нового canvas — скрываем его с глаз
      obj.d.body.appendChild(obj.s);// Добавляем стили в document
      obj.img = new Image();// Создадим объект класса Image (нативный JS)
      obj.img.src = mapIMG;// Присвоем ему путь к изображению
      obj.img.onload = () => {// Когда загрузится... выполним код ниже
        obj.cnt.drawImage(obj.img, 0, 0, obj.w, obj.h) // Нарисуем изображение на canvas из PNG файла
        obj.data = obj.cnt.getImageData(0, 0, obj.w, obj.h)
        obj.data = obj.data.data;// Возьмём точки из canvas
        obj.ar = [];
        // ** Код ниже для shader (для будущих уроков)
        const impacts = [];
        for (let i = 0; i < circlePointsAr.length; i++) {
          impacts.push({
            impactPosition: new THREE.Vector3(circlePointsAr[i][0], circlePointsAr[i][1], circlePointsAr[i][2]),
            impactMaxRadius: 0.0001 + (Math.random() * 0.0002),
            impactRatio: 0.01
          });
        }
        let uniforms = {
          impacts: { value: impacts }
        }
        // \ **

        // Важный код. Наполним массив точками из данных из canvas
        for (let y = 0; y < obj.w; y++) {// по оси Y
          for (let x = 0; x < obj.w; x++) {// по оси X
            const a = obj.data[((obj.w * y) + x) * 4 + 3];// берём только n-нные значения
            if (a > 200) {
              obj.ar.push([x - obj.w, y - obj.w / 6.2])// здесь 6.2 — это как бы «отступ от севера»
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
        positionHelper.position.z = .5;
        // positionHelper.position.z = Math.random();
        latHelper.add(positionHelper);
        // Used to move the center of the cube so it scales from the position Z axis
        const originHelper = new THREE.Object3D();
        originHelper.position.z = .5;
        positionHelper.add(originHelper);
        const lonFudge = Math.PI * .5;
        const latFudge = Math.PI * -0.135;
        const geometries = [];


        obj.nAr = [];
        obj.counter = 0;
        obj.counter2 = 0;

        // Материал с шейдером, который поможет скруглить PlaneBufferGeometry и анимировать, сделать «бум»
        let materialCircles = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.FrontSide,
          onBeforeCompile: shader => {
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
          `);
          }

        });
        materialCircles.defines = { "USE_UV": "" };

        let uty0 = 0
        // Проходимся по массиву наших точек («кружочков»)
        obj.ar.map(e => {
          uty0++
          obj.counter2++;
          const geometry = new THREE.PlaneGeometry(0.005, 0.005);
          // Позиционирование «кружочков»
          // +15 — вращаем на 15 градусов западнее, хотя это можно было сделать иначе — вращать уже весь объект, а не каждый из «кружочков»
          // degToRad — https://threejs.org/docs/#api/en/math/MathUtils.degToRad
          lonHelper.rotation.y = THREE.MathUtils.degToRad(e[0]) + lonFudge + 15;
          const w = latHelper.rotation.x = THREE.MathUtils.degToRad(e[1]) + latFudge;
          if (w - obj.prewLatX === 0/*&&obj.counter2%2==0*/) {
            originHelper.updateWorldMatrix(true, false);// ЭТА
            geometry.applyMatrix4(originHelper.matrixWorld);// и ЭТА штуки необходимы для обновления позиции отдельного «кружочка»
            // Код ниже для анимирования «бум»
            geometry.setAttribute("center", new THREE.Float32BufferAttribute(geometry.attributes.position.array, 3));
            // Добавим вновь созданный «кружочек» в массив
            geometries.push(geometry);
          }
          obj.prewLatX = w;
        });
        //Сформируем лишь одну буферную геометрию (которая по-идее должна обрабатываться на видео карте)
        //из массива ранее сформированных «кружочков»
        const geometryCircles = mergeGeometries(geometries, false);

        meshCircles = new THREE.Mesh(geometryCircles, materialCircles);
        // ниже тестовый материал, чтобы можно было увидеть НЕ «кружочки», а реальные PlaneBufferGeometry
        //meshCircles = new THREE.Mesh(geometryCircles, new THREE.MeshBasicMaterial({color:0xffffff}));

        // Добавим на сцену наш новый объект (саму карту)
        scene.add(meshCircles);

        //Добавим новый объект (саму карту) к родительскому элементу
        parent.add(meshCircles);

        // Немного увеличим наш новый объект, чтобы все «кружочки» были над поверхностью планеты
        meshCircles.scale.set(1.051, 1.051, 1.051)

        obj.c.remove();// Удалим временный canvas из которого брали точки
        obj.s.remove()// Удалим временные стили
      }
    }
    else {
      let c = [];
      for (let i = 0; i < 29192; i++) {
        const n = xy[i];
        c.push(n);
        if (c.length === 2) {
          const lt = THREE.MathUtils.degToRad(c[1]);
          const ln = THREE.MathUtils.degToRad(c[0]);
          const phi = Math.PI / 1.7 - lt;
          const theta = 2 * Math.PI - ln;
          const m = new THREE.Mesh(
            new THREE.CircleGeometry(0.0035, 6),
            new THREE.MeshBasicMaterial({
              color: 0xffffff,
              side: THREE.BackSide,
            })
          );
          // .662, .8, -.28
          g.add(m)
          m.position.setFromSphericalCoords(1.06, phi, theta);
          m.lookAt(new THREE.Vector3);
          c.length = 0;
        }
        g.rotateZ(10)
        scene.add(g);

      }
      // if (p) parent.add(g);
      return g;

    }
  };
  // const dotsMeshGroup = drawXYcords(mapIMG);
  const dotsMeshGroup = drawXYcords(dotsSphere, dotGroup);
  // console.log(dotsMeshGroup);

  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // And render events here
    render({ time, deltaTime }) {
      // lightGroup.rotation.y = time * (10 * Math.PI / 180) * 2;
      // parent.rotation.y = -(time * ((10 * Math.PI) / 180));
      // console.log(camera.position); // Vector3 {x: 1.311504434817275, y: 9.70059610982433, z: 6.370901916645389}
      // {x: x + 10.4, y: y + 4, z: z -3.5}
      lightGroup.position.copy(camera.position);

      controls.update();
      renderer.render(scene, camera);
    },

    // Dispose of WebGL context (optional)
    unload() {
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
