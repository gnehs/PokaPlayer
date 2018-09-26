#!/bin/sh
echo "正在檢查並安裝新 node_modules"
npm install --production
echo "正在啟動 PokaPlayer..."
npm start