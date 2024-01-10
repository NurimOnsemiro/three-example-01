import path from 'path'
import puppeteer, {Browser} from 'puppeteer'
import express from 'express'
import serveStatic from 'serve-static'
import bodyParser from 'body-parser'
import http, {Server} from 'http'
import {mkdirp} from 'mkdirp'
import {rimrafSync} from 'rimraf'
import mutexify from 'mutexify'

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
      printDetailLog = String(req.headers['3d-snapshot-detail-log'] ?? 'false').toLowerCase() === 'true'
      await makeSnapshot()
      const makeApng = String(req.headers['3d-snapshot-generate-apng'] ?? 'false').toLowerCase() === 'true'
      if (makeApng) {
        await makeGifByPngFiles()
      }
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

function logTimestampWrap(title, message) {
  if (!printDetailLog) return
  console.log(message)
  console.timeLog(title)
}

async function makeSnapshot() {
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
      await page.evaluate(async () => {
        const THREE = await import('./js/three.js')
        await THREE.loadObjects()
      })
      logTimestampWrap('Snapshot', 'create puppeteer and goto website')
      
      for (let i = 0; i < NUM_SNAPSHOTS; i++) {
        await page.screenshot({
          path: path.join(process.cwd(), `./output/example_${i}.png`),
          fullPage: false
        })
        logTimestampWrap('Snapshot', 'capture puppeteer screenshot')
        await page.evaluate(async () => {
          // WARNING: evaluate 내부 코드는 문자열 형태로 웹브라우저에 전달되므로, 외부에서 변수를 전달할 수 없습니다.
          const THREE = await import('./js/three.js')
          const UNIT_RADIAN = 0.5235987755982988 // (360 / 12) * (Math.PI / 180)
          // const UNIT_RADIAN = 0.26166666666666666 // (360 / 24) * (Math.PI / 180)
          THREE.setObjectsRotateRadianOnce(UNIT_RADIAN)
        })
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