
FROM node:14-alpine3.15

WORKDIR /app 

RUN apk add git 
RUN git clone https://github.com/gnehs/PokaPlayer .

COPY . /app 

RUN apk update  
RUN apk add --no-cache --virtual build-pkg build-base python2 
RUN npm install --production --silent  
RUN apk del build-pkg

# 環境設定
ENV NODE_ENV=production
EXPOSE 3000
# 啟動
CMD ["npm", "start"]

