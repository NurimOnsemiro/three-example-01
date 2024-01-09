# 리눅스에서 개발 환경 설정

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
apt-get install -y libasound2 libgtk-3-dev libnss3
npm run start
```

# 웹 브라우저에서 접속하기

- `npm run start`를 입력하여 웹 서버를 실행합니다.
- 웹 브라우저에서 `localhost:3000/public`에 접속합니다.
- 3D 모델을 회전시키고 싶다면, 개발자 도구의 콘솔에서 `(await import('./js/three.js')).setObjectsRotateRadian(0.03)`을 입력합니다.

# 3D 스냅샷 생성하기

- Postman에서 POST 메소드로 `http://localhost:3000/snapshot`의 URI를 호출합니다.
- output 폴더에 12장의 스냅샷이 생성되는 것을 확인합니다.
- 애니메이션 이미지 파일을 생성하고자 하는 경우, 요청 헤더에 '3d-snapshot-generate-apng'의 값을 true로 전달합니다.
