
FROM node:14-alpine

WORKDIR /app 
# 覆蓋拉取的程式碼避免干擾到 dev
COPY . /app 

RUN apk update  
RUN apk add --no-cache --virtual build-pkg build-base python2 
RUN npm install --production --silent  
RUN apk del build-pkg

RUN apk add git
RUN git init
RUN git add remote https://github.com/gnehs/PokaPlayer.git
# 環境設定
ENV NODE_ENV=production
EXPOSE 3000
# 啟動
CMD ["npm", "start"]

