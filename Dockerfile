FROM node:10-alpine

RUN mkdir /app
WORKDIR /app

RUN apk add --no-cache make gcc g++ python git sed
RUN git clone https://github.com/gnehs/PokaPlayer.git .
RUN npm install --production

RUN mkdir ./NeteaseCloudMusicApi
RUN git clone https://github.com/Binaryify/NeteaseCloudMusicApi.git /NeteaseCloudMusicApi
RUN npm install /NeteaseCloudMusicApi
RUN sed -i 's/"User-Agent": randomUserAgent()/"User-Agent": randomUserAgent(), "X-Real-IP":`36\.\${Math\.floor(Math\.random() \* 64) + 128}\.\${Math\.floor(Math\.random() \* 255) + 1}\.\${Math.floor(Math\.random() \* 255) + 1}`/g' /NeteaseCloudMusicApi/util/util.js

RUN npm install forever -g

ENV NODE_ENV=production

EXPOSE 3000

RUN echo "cd /app" > /start.sh
RUN echo 'PORT=4000 forever start /NeteaseCloudMusicApi/app.js -w /NeteaseCloudMusicApi/package.json -w /NeteaseCloudMusicApi/util/util.js ' >> /start.sh
RUN echo 'forever -c "npm start" ./' >> /start.sh
CMD ["sh", "/start.sh"]
