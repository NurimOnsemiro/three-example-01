
Image: node:20-slim

```bash
apt-get update
apt-get install git
cd home
git clone https://github.com/NurimOnsemiro/three-example-01.git
cd three-example-01
export NODE_TLS_REJECT_UNAUTHORIZED=0
export PUPPETEER_SKIP_DOWNLOAD=true
npm install
npx puppeteer browsers install chrome
apt-get install -y libasound2 libgdk-pixbuf2.0-dev libgtk-3-dev libxss-dev libnss3-dev
```