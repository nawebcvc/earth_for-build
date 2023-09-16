function getXYcord(mapIMG) {
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
};