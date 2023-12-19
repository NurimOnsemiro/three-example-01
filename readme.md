
```bash
apt-get update
apt-get install git

```

```bash
apt-get install -y build-essential libxi-dev libglu1-mesa-dev libglew-dev pkg-config gnupg libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev xvfb mesa-utils libgl1-mesa-dri libglapi-mesa libosmesa6 libgl1-mesa-dev
Xvfb :99 -screen 0 1024x768x24 </dev/null &
export DISPLAY=:99
```

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
export PUPPETEER_SKIP_DOWNLOAD=true
```

```npm
npx puppeteer browsers install chrome
```