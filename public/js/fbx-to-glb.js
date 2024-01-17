import * as THREE from 'three'
import {FBXLoader} from 'three/addons/loaders/FBXLoader'
import {TGALoader} from 'three/addons/loaders/TGALoader'
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter'

const manager = new THREE.LoadingManager()
manager.addHandler(/\.tga$/i, new TGALoader())

function encodeGlb(blob) {
  const bytes = new Uint8Array(blob)
  const len = bytes.byteLength
  let binary = ''
  for(let i=0;i<len;i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function convertFbxToGlb(filePath) {
  console.log(`convertFbxToGlb: ${filePath}`)
  const object = await loadFbx(filePath)
  const texture = await loadTgaTexture('models/Bamalron/Bamalron_DIFF.tga')
  // const texture = await loadTexture('models/Bamalron/Bamalron_DIFF.png')
  object.traverse(child => {
    if (child.isMesh) {
      // https://threejs.org/docs/#api/en/objects/Mesh
      // const oldMaterial = child.material
      const meshStandardMaterial = new THREE.MeshStandardMaterial()
      child.material = meshStandardMaterial
      // console.log(typeof child.material)
      child.material.map = texture
      child.material.needsupdate = true
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  console.log('change child material map ok')
  return await exportGltf(object)
}

export async function loadFbx(filePath) {
  return new Promise((resolve, reject) => {
    const loader = new FBXLoader(manager)
    loader.load(
      filePath, 
      (object) => {
        console.log('fbx load ok')
        resolve(JSON.stringify(object, null, 2))
      },
      (evt) => {
        // console.log(evt.loaded / evt.total * 100, '% loaded')
      },
      reject
    )
  })
}

async function loadTexture(filePath) {
  const textureLoader = new THREE.TextureLoader()
  const texture = await textureLoader.loadAsync(filePath)
  console.log('load texture ok', texture)
  return texture
}

async function loadTgaTexture(filePath) {
  return new Promise((resolve, reject) => {
    const textureLoader = new TGALoader()
    textureLoader.load(filePath, texture => {
      console.log('load tga texture ok', texture)
      resolve(texture)
    },
    (xhr) => {},
    (err) => {
      reject(err)
    }
    )
  })
}

async function exportGltf(object) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter()
    exporter.parse(
      object, 
      (gltf) => {
        console.log('gltf parse ok')
        const encodedGlb = encodeGlb(gltf)
        resolve(encodedGlb)
      },
      reject,
      {
        binary: true
      }
    )
  })
}

export async function exportFbxToGlb() {
  const queryString = window.location.search
  const searchParams = new URLSearchParams(queryString)
  const modelPath = searchParams.get('modelPath')
  console.log('modelPath:', modelPath)
  const result = await convertFbxToGlb(`models/${modelPath}`)
  // console.log(result)
  return result
}