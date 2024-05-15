import * as THREE from 'three';
import {
    DRACOLoader
} from 'three/addons/loaders/DRACOLoader.js';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js'; // Import OrbitControls for camera orbiting
import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import {
    RGBELoader
} from 'three/addons/loaders/RGBELoader.js';

const canvasContainer = document.getElementById('myCanvas-2');
const renderer = new THREE.WebGLRenderer({
    alpha: true
});
canvasContainer.appendChild(renderer.domElement);

renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
camera.position.set(6, 6, 6);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableZoom = false;
orbit.update();

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/assets/js/draco/');
dracoLoader.preload();
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
const rgbeLoader = new RGBELoader();

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2;

let item;

rgbeLoader.load('/assets/MR_INT-005_WhiteNeons_NAD.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;

    gltfLoader.load('/models/thisearth/scene.gltf', function (gltf) {
        const model = gltf.scene;
        model.scale.set(0.05, 0.05, 0.05); // Adjust scale as needed

        const boundingBox = new THREE.Box3().setFromObject(model);
        const center = boundingBox.getCenter(new THREE.Vector3());
        camera.position.copy(center.clone().add(new THREE.Vector3(10, 0, 0)));
        camera.lookAt(center);

        scene.add(model);
        item = model;
    });
});

function animate() {
    if (item)
        item.rotation.y += 0.009;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', function () {
    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
});