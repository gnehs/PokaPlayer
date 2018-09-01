FROM node:10-alpine
RUN mkdir /app
WORKDIR /app

RUN apk add --no-cache make gcc g++ python git sed
RUN git clone https://github.com/gnehs/PokaPlayer.git .
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]

