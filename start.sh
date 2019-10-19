#!/bin/sh
npm install --production
npm install -g pm2
pm2 start ecosystem.config.js