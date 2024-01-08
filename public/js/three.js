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

function loadCube() {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({color: 0x00ff00})
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)
  objects.push(cube)
  setupCamera(cube)
  return cube
}

function loadObjFile(filePath) {
  const loader = new OBJLoader()
  return commonLoader(loader, filePath, (arg) => {
    arg.scale.set(.1, .1, .1)
    scene.add(arg)
    objects.push(arg)
    return arg
  })
}

function loadFbxFile(filePath) {
  const loader = new FBXLoader(manager)
  return commonLoader(loader, filePath, (arg) => {
    arg.traverse(child => {
      if(child.isMesh) {}
    })
    arg.scale.set(.015, .015, .015)
    scene.add(arg)
    objects.push(arg)
    return arg
  })
}

async function loadGltfFile(filePath) {
  const loader = new GLTFLoader(manager)
  return commonLoader(loader, filePath, (arg) => {
      const data = arg.scene
      scene.add(data)
      objects.push(data)
      console.log('loadGltfFile completed')
      return data
  })
}

async function commonLoader(loader, filePath, callback) {
  return new Promise((resolve, reject) => {
    loader.load(filePath, 
      (arg) => {
        const model = callback(arg)
        setupCamera(model)
        resolve()
      },
      (evt) => {
        console.log(evt.loaded / evt.total * 100, '% loaded')
      },
      (err) => {
        if(err) reject(err)
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
  // loadObjFile('models/seanwasere.obj')
  // loadFbxFile('models/pikachu/pikachu.fbx')
  // await loadGltfFile('models/house.glb')
  await loadGltfFile('models/cargo_ship.glb')
  // loadCube()
}

function setupLight() {
  const light1 = new THREE.AmbientLight(0xFFFFFF, 2)
  scene.add(light1)
  // const pointLight1 = new THREE.PointLight(0xffffff, 10, 100)
  // pointLight1.position.set(0, 5, 0)
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