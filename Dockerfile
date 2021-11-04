FROM node

WORKDIR /app
# 安裝必要組件
RUN apk add --no-cache git
# 拉取程式碼
RUN git clone https://github.com/gnehs/PokaPlayer.git .
# 覆蓋拉取的程式碼避免干擾到 dev
COPY . /app 
# node modules
RUN npm install --production
# 環境設定
ENV NODE_ENV=production
EXPOSE 3000
# 啟動
CMD ["npm", "start"]

