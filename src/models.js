import * as Three from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltfLoader = new GLTFLoader();

export const sceneModel = gltfLoader.load( './public/scene.gltf' );
