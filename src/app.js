import path from 'path'
import puppeteer from 'puppeteer'
import express from 'express'
import serveStatic from 'serve-static'
import bodyParser from 'body-parser'
import http from 'http'
import {mkdirp} from 'mkdirp'
import {rimrafSync} from 'rimraf'
import mutexify from 'mutexify'

const lock = mutexify()
let server

const NUM_SNAPSHOTS = 12

async function sleepMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @returns {http.Server}
 */
async function setupHttpServer() {
  return new Promise((resolve, reject) => {
    const app = express()
    app.set('port', 3000)
    app.use('/public', serveStatic(path.join(process.cwd(), './public')))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({extended: false}))

    app.post('/snapshot', async (req, res) => {
      await makeSnapshot()
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
  })
}

async function makeSnapshot() {
  return new Promise(resolve => {
    lock(async release => {
      const outputDir = path.join(process.cwd(), './output')
      rimrafSync(outputDir)
      await mkdirp(outputDir)
      
      const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox']})
      const page = await browser.newPage()
      await page.setViewport({width: 1024, height: 1024})
      await page.goto('http://localhost:3000/public')
      
      for (let i = 0; i < NUM_SNAPSHOTS; i++) {
        await page.screenshot({
          path: path.join(process.cwd(), `./output/example_${i}.png`),
          fullPage: false
        })
        await page.evaluate(async () => {
          // WARNING: evaluate 내부 코드는 문자열 형태로 웹브라우저에 전달되므로, 외부에서 변수를 전달할 수 없습니다.
          const THREE = await import('./js/three.js')
          const UNIT_RADIAN = 0.5235987755982988 // (360 / 12) * (Math.PI / 180)
          THREE.setObjectsRotateRadianOnce(UNIT_RADIAN)
        })
      }
      await browser.close()
      release()
      resolve()
    })
  })
}

async function main() {
  server = await setupHttpServer()
}
main()