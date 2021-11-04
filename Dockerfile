
FROM node:14-alpine

WORKDIR /app 
# 覆蓋拉取的程式碼避免干擾到 dev
COPY . /app 

RUN apk update  
RUN apk add --no-cache --virtual build-pkg build-base python2 git  
RUN npm install --production --silent  
RUN apk del build-pkg
# 環境設定
ENV NODE_ENV=production
EXPOSE 3000
# 啟動
CMD ["npm", "start"]

