#!/bin/sh
echo "[start.sh] install node_modules"
npm install --production
echo "[start.sh] starting PokaPlayer......"
npm start