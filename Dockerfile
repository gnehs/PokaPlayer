FROM node:10-alpine

RUN mkdir /app
WORKDIR /app

RUN apk add --no-cache make gcc g++ python git
RUN git clone https://github.com/gnehs/PokaPlayer.git .
RUN npm install --production

RUN mkdir ./NeteaseCloudMusicApi
RUN git clone https://github.com/Binaryify/NeteaseCloudMusicApi.git ./NeteaseCloudMusicApi
RUN npm install ./NeteaseCloudMusicApi

RUN npm install forever -g
RUN PORT=4000 forever start ./NeteaseCloudMusicApi/app.js

ENV NODE_ENV=production

EXPOSE 3000
EXPOSE 4000

CMD ["forever", "-c", '"npm start"', "./"]
