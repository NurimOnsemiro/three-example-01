import * as THREE from 'three'
import {OBJLoader} from 'three/addons/loaders/OBJLoader'
import {FBXLoader} from 'three/addons/loaders/FBXLoader'
import {TGALoader} from 'three/addons/loaders/TGALoader'

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
}

function loadObjFile(filePath) {
  const loader = new OBJLoader()
  loader.load(filePath, 
    (data) => {
      data.scale.set(.1, .1, .1)
      scene.add(data)
      objects.push(data)
    },
    (evt) => {
      console.log(evt.loaded / evt.total * 100, '% loaded')
    },
    (err) => {
      if(err){
        console.error(err)
      }
    }
  )
}

function loadFbxFile(filePath) {
  const loader = new FBXLoader(manager)
  loader.load(filePath, 
    (data) => {
      data.traverse(child => {
        if(child.isMesh) {
          
        }
      })
      data.scale.set(.01, .01, .01)
      scene.add(data)
      objects.push(data)
    },
    (evt) => {
      console.log(evt.loaded / evt.total * 100, '% loaded')
    },
    (err) => {
      if(err){
        console.error(err)
      }
    }
  )
}

function loadObjects() {
  // loadObjFile('models/seanwasere.obj')
  loadFbxFile('models/Alpaca/Alpaca.fbx')
  // loadFbxFile('models/Artuman/Artuman.fbx')
  // loadFbxFile('models/Bakun/Bakun.fbx')
  // loadCube()
}

function setupLight() {
  const light1 = new THREE.AmbientLight(0xFFFFFF, 400)
  scene.add(light1)
}

scene = new THREE.Scene()
camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)

renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0xffffff, 0)
document.body.appendChild(renderer.domElement)

camera.position.y = 3
camera.position.z = 11

function animate() {
  requestAnimationFrame(animate)

  for(const object of objects) {
    // object.rotation.x += 0.01
    object.rotation.y += 0.02
    // object.rotation.z += 0.01
  }

  renderer.render(scene, camera)
}

animate()

loadObjects()
setupLight()