[![works badge](https://cdn.rawgit.com/nikku/works-on-my-machine/v0.2.0/badge.svg?style=flat-square)](https://github.com/nikku/works-on-my-machine)
[![GitHub issues](https://img.shields.io/github/issues/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/issues)
[![GitHub forks](https://img.shields.io/github/forks/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/network)
[![GitHub stars](https://img.shields.io/github/stars/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/stargazers)
[![GitHub license](https://img.shields.io/github/license/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/blob/master/LICENSE)
[![GitHub tag (latest Ver)](https://img.shields.io/github/package-json/v/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/releases/latest)
[![GitHub repo size in bytes](https://img.shields.io/github/repo-size/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/archive/master.zip)
[![Docker Build Status](https://img.shields.io/docker/build/gnehs/pokaplayer.svg?style=flat-square)](https://hub.docker.com/r/gnehs/pokaplayer/)

# PokaPlayer
PokaPlayer 是個能統合多個來源並進行播放的播放器。

![image](https://user-images.githubusercontent.com/16719720/112633008-cc020600-8e73-11eb-8cb2-191301de9d04.png)

## 開始使用
- 按照 config-simple.json 填寫設定檔
- 部署 [PokaPlayer](https://hub.docker.com/repository/docker/gnehs/pokaplayer) 與 [Mongo](https://hub.docker.com/_/mongo) 容器 (可選用 [neteasecloudmusicapi](https://hub.docker.com/repository/docker/gnehs/neteasecloudmusicapi-docker))
    - 將設定檔掛載到 `/app/config.json`
    - 連接 mongo 容器
    - export port 3000
- 完成！
 
## 建議和提示

-   手機建議使用 Chrome
-   Chrome 右上角 `...` 選「加到主畫面」可以有原生 APP 般的體驗
-   **DSM 強烈建議開一個只能播音樂的帳號**

## 支援的來源
-   [DSM Audio Station](https://www.synology.com/dsm/feature/audio_station)
-   [Netease Cloud Music](https://music.163.com/)
    -   該模組之歌詞轉換功能使用了 [繁化姬](https://zhconvert.org/) 的 API 服務

## 功能
-   釘選項目
-   搜尋
-   專輯
-   最近加入的專輯
-   資料夾
-   演出者
-   作曲者
-   隨機播放
-   密碼保護
-   夜間模式
-   多使用者
-   MediaSession

<img src="https://i.imgur.com/GOIe3va.png" width="500px">

## 貢獻者

[@gnehs](https://github.com/gnehs)
[@rexx0520](https://github.com/rexx0520)
[@coin3x](https://github.com/coin3x)
[@hang333](https://github.com/hang333)
[@hugwalk](https://github.com/hugwalk)
[@koru1130](https://github.com/koru1130)