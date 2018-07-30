FROM node:10-alpine

WORKDIR /app

COPY package.json /app  
RUN apk add --no-cache make gcc g++ python
RUN npm install --production

COPY . /app 

ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "index.js"]