FROM mhart/alpine-node:8

# Create app directory
RUN mkdir -p /app
WORKDIR /app
# Bundle app source
COPY . /app
# Install app dependencies
COPY package.json /app/
# If you have native dependencies, you'll need extra tools
RUN apk add --no-cache make gcc g++ python

RUN npm install --production

EXPOSE 3000
CMD ["node", "index.js"]