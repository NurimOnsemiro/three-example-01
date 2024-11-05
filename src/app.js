import path from 'path'
import puppeteer, {Browser} from 'puppeteer'
import express from 'express'
import serveStatic from 'serve-static'
import bodyParser from 'body-parser'
import http, {Server} from 'http'
import {mkdirp} from 'mkdirp'
import {rimrafSync} from 'rimraf'
import mutexify from 'mutexify'
import fs from 'fs'

const convertFbxToGlbFunc = fs.readFileSync('./src/evaluate-fbx.js').toString()

const lock = mutexify()
/** @type {Server} */
let server

/** @type {Browser} */
let browser
const NUM_SNAPSHOTS = 12
const UNIT_RADIAN = (360 / NUM_SNAPSHOTS) * (Math.PI / 180)
let printDetailLog = false

async function sleepMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @returns {Server}
 */
async function setupHttpServer() {
  return new Promise((resolve, reject) => {
    const app = express()
    app.set('port', 3000)
    app.use('/public', serveStatic(path.join(process.cwd(), './public')))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({extended: false}))

    app.post('/snapshot', async (req, res) => {
      const targetFile = req.headers['3d-snapshot-target-file'] ?? ''
      printDetailLog = String(req.headers['3d-snapshot-detail-log'] ?? 'false').toLowerCase() === 'true'
      await makeSnapshot(targetFile)
      const makeApng = String(req.headers['3d-snapshot-generate-apng'] ?? 'false').toLowerCase() === 'true'
      if (makeApng) {
        await makeGifByPngFiles()
      }
      res.sendStatus(200)
    })

    app.post('/fbx-to-glb', async (req, res) => {
      const fileName = req.body.fileName
      console.log('fbx to glb:', fileName)
      await convertFbxToGlb(fileName)
      
      res.sendStatus(200)
    })

    const server = http.createServer(app)

    server.listen(app.get('port'), () => {
      console.log(`Express http server ${app.get('port')} started.`)
      resolve(server)
    })

    server.on('error', (err) => {
      console.log(err)
      reject(err)
    })

    server.on('close', () => {
      console.log('Server closed successfully')
    })

    return server
  })
}

async function convertFbxToGlb(filePath) {
  return new Promise(resolve => {
    lock(async release => {
      const outputDir = path.join(process.cwd(), './exported')
      rimrafSync(outputDir)
      await mkdirp(outputDir)
      
      const page = await browser.newPage()
      await page.setViewport({width: 1024, height: 1024})
      await page.goto(`http://localhost:3000/public/?modelPath=${filePath}`)

      page.
        on('console', message => {
          console.log('console:', message.text())
        }).
        on('response', response => {
          // console.log(response)
        }).
        on('requestfailed', request => {
          console.log(request)
        }).
        on('pageerror', err => {
          console.log(err)
        })

      // const result = await page.evaluate(async () => {
      //   const THREE = await import('./js/fbx-to-glb.js')
      //   const result = await THREE.exportFbxToGlb()
      //   return result
      // })
      const result = await page.evaluate(async () => {
        const THREE = await import('./js/fbx-to-glb.js')
        const result = await THREE.loadFbx('models/Bamalron/Bamalron.fbx')
        return result
      })
      // console.log(JSON.parse(result))

      if (result != null) {
        fs.writeFileSync('./temp.json', Buffer.from(result))
      }

      // if (result != null) {
      //   const glb = decodeGlb(result)
      //   // console.log(glb)
      //   fs.writeFileSync('./exported/result.glb', glb)
      // }

      await page.close()
      release()
      resolve()
    })
  })
}

function decodeGlb(encodedStr) {
  const decoded = atob(encodedStr) // text -> binary
  let binary = []
  for (let i = 0;i < decoded.length;i++) {
    binary.push(decoded.charCodeAt(i))
  }
  const glb = new Uint8Array(binary)
  return glb
}

function logTimestampWrap(title, message) {
  if (!printDetailLog) return
  console.log(message)
  console.timeLog(title)
}

async function makeSnapshot(input) {
  return new Promise(resolve => {
    lock(async release => {
      console.log('Start makeSnapshot')
      console.time('Snapshot')
      const outputDir = path.join(process.cwd(), './output')
      rimrafSync(outputDir)
      await mkdirp(outputDir)
      logTimestampWrap('Snapshot', 'clear prev files')
      
      const page = await browser.newPage()
      await page.setViewport({width: 1024, height: 1024})
      await page.goto('http://localhost:3000/public')
      await page.evaluate(async (targetFile) => {
        const THREE = await import(`${'./js/three.js'}`)
        await THREE.loadObjects(targetFile)
      }, input)
      // await page.evaluate(`three.loadObjects("${input}")`) // typescript에서 사용
      logTimestampWrap('Snapshot', 'create puppeteer and goto website')
      
      for (let i = 0; i < NUM_SNAPSHOTS; i++) {
        await page.screenshot({
          path: path.join(process.cwd(), `./output/example_${i}.png`),
          fullPage: false
        })
        logTimestampWrap('Snapshot', 'capture puppeteer screenshot')
        await page.evaluate(async (captureCount) => {
          const THREE = await import(`${'./js/three.js'}`)
          const UNIT_RADIAN = (360 / captureCount) * (Math.PI / 180)
          THREE.setObjectsRotateRadianOnce(UNIT_RADIAN)
        }, 12)
        logTimestampWrap('Snapshot', 'rotate 3d model')
      }
      logTimestampWrap('Snapshot', 'create snapshot')
      await page.close()
      // await browser.close()
      release()
      console.log('done')
      console.timeEnd('Snapshot')
      resolve()
    })
  })
}

function setupPuppeteer() {
  return puppeteer.launch({headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars', '--mute-audio']})
  // return puppeteer.launch({headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars', '--mute-audio', '--disable-gpu']})
}

import sharp from 'sharp'
import apng from 'sharp-apng'
import {atob, btoa} from 'buffer'
async function makeGifByPngFiles() {
  let files = []
  for (let i = 0; i < NUM_SNAPSHOTS; i++) {
    files.push(sharp(path.join(process.cwd(), `./output/example_${i}.png`)))
  }
  apng.framesToApng(files, path.join(process.cwd(), './output/result.png'))
}

async function main() {
  browser = await setupPuppeteer()
  server = await setupHttpServer()
}
main()