const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Обработчик события клика на объект
function handleClick(event) {
  console.log("Hello World");
}

// Добавление обработчика события клика на объект
mesh.addEventListener('click', handleClick);