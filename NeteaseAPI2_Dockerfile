FROM node:10-alpine
RUN mkdir /app
WORKDIR /app

RUN apk add --no-cache make gcc g++ python git sed && \
    git clone https://github.com/Binaryify/NeteaseCloudMusicApi.git . && \
    sed -i 's/"User-Agent": randomUserAgent()/"User-Agent": randomUserAgent(), "X-Real-IP":`36\.\${Math\.floor(Math\.random() \* 64) + 128}\.\${Math\.floor(Math\.random() \* 255) + 1}\.\${Math.floor(Math\.random() \* 255) + 1}`/g' ./util/request.js && \
    npm install --production && \
    npm cache clean --force && \
    apk del make gcc g++ python sed
    
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "app.js"]

