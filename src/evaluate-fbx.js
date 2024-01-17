import * as THREE from 'three'
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader'

async function loadFbx(filePath) {
  return new Promise((resolve, reject) => {
    const loader = new FBXLoader()
    loader.load(
      filePath, 
      (object) => {
        console.log('fbx load ok')
        object.traverse(child => {
          if (child instanceof THREE.Mesh) {
            const oldMaterial = child.material
            child.material = new THREE.MeshStandardMaterial()
          }
        })
        resolve(object)
      },
      (evt) => {
        // console.log(evt.loaded / evt.total * 100, '% loaded')
      },
      reject
    )
  })
}