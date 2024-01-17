import * as THREE from 'three'
import {OBJLoader} from 'three/addons/loaders/OBJLoader'
import {FBXLoader} from 'three/addons/loaders/FBXLoader'
import {TGALoader} from 'three/addons/loaders/TGALoader'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader'

const manager = new THREE.LoadingManager()
manager.addHandler(/\.tga$/i, new TGALoader())

let scene
let camera
let renderer
let objects = []

async function loadCube() {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({color: 0x00ff00})
  const object = new THREE.Mesh(geometry, material)
  scene.add(object)
  objects.push(object)
  setupCamera(object)
  return object
}

async function loadObjFile(filePath) {
  const loader = new OBJLoader()
  return commonLoader(loader, filePath, (object) => {
    scene.add(object)
    objects.push(object)
    return object
  })
}

async function loadFbxFile(filePath) {
  const loader = new FBXLoader(manager)
  return commonLoader(loader, filePath, (object) => {
    // const textureLoader = new THREE.TextureLoader(manager)
    // const textureLoader = new TGALoader(manager)
    // object.traverse(child => {
    //   if (child.isMesh) {
    //     // https://threejs.org/docs/#api/en/objects/Mesh
    //     const diffuseTexture = 'models/Bamalron/Bamalron_DIFF.tga'
    //     textureLoader.load(diffuseTexture, (texture) => {
    //       child.material.map = texture
    //       child.material.needsupdate = true
    //       console.log(texture)
    //     })
    //     child.castShadow = true
    //     child.receiveShadow = true
    //   }
    // })

    scene.add(object)
    objects.push(object)
    return object
  })
}

async function loadGltfFile(filePath) {
  const loader = new GLTFLoader(manager)
  return commonLoader(loader, filePath, (objectMeta) => {
    console.log(objectMeta)
    const object = objectMeta.scene
    scene.add(object)
    objects.push(object)
    console.log('loadGltfFile completed')
    return object
  })
}

function adjustSize(object) {
  const box = new THREE.Box3().setFromObject(object)
  const size = box.getSize(new THREE.Vector3()).length()
  const scalar = 1
  console.log(box, size)
  object.scale.multiplyScalar(scalar/size)
}

function adjustMaterial(object) {
  object.traverse(child => {
    if(child instanceof THREE.Mesh) {
      const material = child.material
      // console.log(material)
      const colorValue = 3
      material.color = new THREE.Color(colorValue,colorValue,colorValue)
    }
  })
}

async function commonLoader(loader, filePath, callback) {
  return new Promise((resolve, reject) => {
    loader.load(filePath, 
      (arg) => {
        const model = callback(arg)
        adjustSize(model)
        adjustMaterial(model)
        setupCamera(model)
        resolve()
      },
      (evt) => {
        console.log(evt.loaded / evt.total * 100, '% loaded')
      },
      (err) => {
        if(err) {
          console.error('error:', err)
          reject(err)
        }
      }
    )
  })
}

function setupCamera(model) {
  const box = new THREE.Box3().setFromObject(model)
  const boxSize = box.getSize(new THREE.Vector3()).length()
  const boxCenter = box.getCenter(new THREE.Vector3())
  console.log(boxSize, boxCenter)

  camera.position.x = boxCenter.x
  camera.position.y = boxCenter.y
  camera.position.z = boxCenter.z + boxSize / Math.tan((Math.PI / 180) * camera.fov / 2)

  camera.lookAt(boxCenter)
  camera.updateProjectionMatrix()
}

export async function loadObjects() {
  try {
    // await loadObjFile('models/seanwasere.obj')
    // await loadObjFile('models/teapot.obj')
    // await loadObjFile('models/airboat.obj')
    // await loadObjFile('models/BAC_Batman70s_rocksteady/batman.obj')
    // await loadFbxFile('models/Bamalron/Bamalron.fbx')
    // await loadFbxFile('models/Baphomet.fbx')
    // await loadFbxFile('models/Alpaca.fbx')
    // await loadFbxFile('models/Basilisk/Basilisk.fbx')
    // await loadFbxFile('models/eyeball/eyeball.fbx')
    // await loadFbxFile('models/BatraBeholder/BatraBeholder.fbx')
    // await loadFbxFile('models/pikachu/Pikachu.fbx')
    // await loadFbxFile('models/BAC_Batman70s_rocksteady/batman70.fbx')
    // await loadGltfFile('models/Alpaca.glb')
    // await loadGltfFile('models/BatraBeholder-v1.glb')
    // await loadGltfFile('models/batman70-v1.glb')
    // await loadGltfFile('models/batman70t.glb')
    // await loadGltfFile('models/batman-v1.glb')
    // await loadGltfFile('models/catwoman.glb')
    // await loadGltfFile('models/fbi-agent-v1.glb')
    // await loadGltfFile('models/house.glb')
    // await loadGltfFile('models/house-v2.glb')
    // await loadGltfFile('models/eyeball-v1.glb')
    // await loadGltfFile('models/pikachuF.glb')
    await loadGltfFile('models/pikachu-v1.glb')
    // await loadGltfFile('models/cargo_ship.glb')
    // await loadGltfFile('models/pantherboss-v1.glb')
    // await loadGltfFile('models/Baphomet-v1.glb')
    // await loadGltfFile('models/Cyprys_Houseobj-v1.glb')
    // await loadGltfFile('models/Bamalron-v1.glb')
    // await loadGltfFile('models/bamalron_out/Bamalron.gltf')
    // await loadCube()
  } catch (err) {
    console.error(err)
  }
}

export function setupLight() {
  const light1 = new THREE.AmbientLight(0xFFFFFF, 1)
  scene.add(light1)
  // const pointLight1 = new THREE.PointLight(0xffffff, 10000, 1000)
  // pointLight1.position.set(3, 5, 0)
  // scene.add(pointLight1)
}

scene = new THREE.Scene()
camera = new THREE.PerspectiveCamera(
  45, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
)

renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0xFFFFFF, 0)
document.body.appendChild(renderer.domElement)

camera.position.y = 3
camera.position.z = 11

let radian = 0
let radianOnce = 0
export function setObjectsRotateRadian(value) {
  radian = value
}
export function setObjectsRotateRadianOnce(value) {
  radianOnce = value
}

export function hello() {
  const message = 'hello world~'
  console.log(message)
  return message
}

function animate() {
  requestAnimationFrame(animate)
  
  if(radianOnce !== 0) {
    for(const object of objects) {
      object.rotation.y += radianOnce
    }
    radianOnce = 0
  } else {
    for(const object of objects) {
      object.rotation.y += radian
    }
  }

  renderer.render(scene, camera)
}

setupLight()
animate()