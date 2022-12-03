
FROM node:14-alpine3.15

WORKDIR /app 

RUN apk add git && git clone https://github.com/gnehs/Pokaplayer .

COPY . /app/

RUN apk update && \ 
apk add --no-cache --virtual build-pkg build-base python2 && \
npm install --production --silent && \
apk del build-pkg

# 環境設定
ENV NODE_ENV=production
EXPOSE 3000
# 啟動
CMD ["npm", "start"]

