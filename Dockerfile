FROM node:10-alpine

RUN mkdir /app
WORKDIR /app

RUN apk add --no-cache make gcc g++ python git
RUN git clone https://github.com/gnehs/PokaPlayer.git .
RUN npm install forever -g
RUN npm install --production

ENV NODE_ENV=production

EXPOSE 3000
EXPOSE 3001

CMD forever -c "npm start" ./

