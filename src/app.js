import path from 'path'
import puppeteer from 'puppeteer'
import express from 'express'
import serveStatic from 'serve-static'
import bodyParser from 'body-parser'
import http from 'http'
import {mkdirp} from 'mkdirp'
import {rimrafSync} from 'rimraf'

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

async function main() {
  const server = await setupHttpServer()

  const outputDir = path.join(process.cwd(), './output')
  rimrafSync(outputDir)
  await mkdirp(outputDir)

  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox']})
  const page = await browser.newPage()

  await page.goto('http://localhost:3000/public')

  await page.setViewport({width: 600, height: 600})

  let cnt = 0
  const timer = setInterval(async () => {
    await page.screenshot({
      path: path.join(process.cwd(), `./output/example_${cnt++}.png`),
      fullPage: false
    })
    if (cnt === 12) {
      clearInterval(timer)
      await browser.close()
      server.close()
      process.exit(0)
    }
  }, 500)
}
main()