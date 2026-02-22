import * as Three from "three";
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltfLoader = new GLTFLoader();
const scene = new Three.Scene();
const camera = new Three.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new Three.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop( animate );
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

let model
gltfLoader.load( '/scene.gltf', (gltf) => {
    model = gltf.scene;
    scene.add(model);
});

function renderPage( pageId ) {
    document.querySelectorAll(".page").forEach( page=> {
        page.classList.remove("active");
    })
    if ( pageId === "page-home") {
        document.getElementById("page-home").classList.add("active");
    }
    else if ( pageId === "page-sim") {
        document.getElementById("page-sim").classList.add("active");

    }
    else {
        console.error("PageId not found.");
    }
}

document.getElementById("play-btn").addEventListener("click", () => {
    renderPage("page-sim");
})



function animate( time ) {
    if(model) {
        model.rotation.y = time / 9000;
        const scale = Math.cos(time / 1000) + 10;
        model.scale.set(scale, scale, scale);
    }
    renderer.render( scene, camera );
}



