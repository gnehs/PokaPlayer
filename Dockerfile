FROM node:10-alpine

#
RUN mkdir /app
WORKDIR /app
COPY . /app

#
RUN apk add --no-cache make gcc g++ python git
RUN npm install --production

#
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]

