import * as Three from "three";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltfLoader = new GLTFLoader();
const scene = new Three.Scene();
const camera = new Three.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new Three.WebGLRenderer();

renderer.setAnimationLoop( animate);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// const geometry = new Three.BoxGeometry( 1, 1, 1 );
// const material = new  Three.MeshBasicMaterial( { color: 0x00ff00 } );
// const mesh = new Three.Mesh( geometry, material );

// scene.add( mesh );

camera.position.z = 5;

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const textElement = document.createElement('div');
textElement.setAttribute('id', 'title');
textElement.textContent = 'Stellar-Evo';
textElement.style.fontSize = '50px';
textElement.style.color = 'white';
textElement.style.fontFamily = "'Audiowide', 'sans-serif'";

const label = new CSS2DObject(textElement);
label.position.set(0, 0, 0)

let model

gltfLoader.load( '/scene.gltf', (gltf) => {
    model = gltf.scene;
    scene.add(model);
});

// const light = new Three.DirectionalLight(0xffffff, 2);
// light.position.set(0, 0, 0);
// scene.add(light);
//
// scene.add(new Three.AmbientLight(0xffffff, 1));
//
// scene.add(label);

function animate( time ) {
    // mesh.rotation.x = time / 2000;
    // mesh.rotation.y = time / 1000;
    if(model) {
        model.rotation.y = time / 9000;
        const scale = Math.cos(time / 1000) + 10;
        model.scale.set(scale, scale, scale);
    }
    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );
}

// document.getElementById('start').addEventListener( 'click', () => {
//     document.getElementById('start-lbl').style.display = 'None';
// });




