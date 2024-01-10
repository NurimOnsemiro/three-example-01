FROM nexus-aws.nexon.com:8445/nxcmd/node/20.9:12.2-slim
RUN apt-get update && apt-get install -y git
RUN git clone https://github.com/NurimOnsemiro/three-example-01.git
WORKDIR /three-example-01

ENV NODE_TLS_REJECT_UNAUTHORIZED 0
ENV PUPPETEER_SKIP_DOWNLOAD true

RUN npm install
RUN npx puppeteer browsers install chrome
RUN apt-get install -y libasound2 libgtk-3-common libnss3

EXPOSE 3000

ENTRYPOINT [ "npm", "run", "start"]