[![works badge](https://cdn.rawgit.com/nikku/works-on-my-machine/v0.2.0/badge.svg?style=flat-square)](https://github.com/nikku/works-on-my-machine)
[![GitHub issues](https://img.shields.io/github/issues/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/issues)
[![GitHub forks](https://img.shields.io/github/forks/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/network)
[![GitHub stars](https://img.shields.io/github/stars/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/stargazers)
[![GitHub license](https://img.shields.io/github/license/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/blob/master/LICENSE)
[![GitHub tag (latest Ver)](https://img.shields.io/github/package-json/v/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/releases/latest)
[![GitHub repo size in bytes](https://img.shields.io/github/repo-size/gnehs/PokaPlayer.svg?style=flat-square)](https://github.com/gnehs/PokaPlayer/archive/master.zip)

[繁體中文](https://github.com/gnehs/PokaPlayer/blob/master/README_zh.md)

# PokaPlayer
PokaPlayer is a player that can unify and play from multiple sources like DSM and Netease.

![image](https://user-images.githubusercontent.com/16719720/139267172-3960a386-d858-4db3-a9d7-30df8f379fd2.png)

## Get Started
- If you need to listen to your local music, you will need a Synology NAS with Audio Station installed, or you can try the [Open Audio Server](https://github.com/openaudioserver/open-audio-server) which is compatible with the Audio Station API.
- Deploy [Mongo](https://hub.docker.com/_/mongo) containers
    - init database
```bash
# docker exec
$ docker exec -it <container name> bash
# enter mongo
$ mongo
# create database and user
$ db.createUser(
        {
            user: "<user for database which shall be created>",
            pwd: "<password of user>",
            roles: [
                {
                    role: "readWrite",
                    db: "<database to create>"
                }
            ]
        }
);
# exit mongo
$ exit
# exit docker
$ exit
```
- Fill out the configuration file according to config-simple.json
- Deploy [PokaPlayer](https://hub.docker.com/repository/docker/gnehs/pokaplayer) container(optional [neteasecloudmusicapi](https://hub.docker.com/repository/docker/gnehs/neteasecloudmusicapi-docker))
    - Mount the configuration file to `/app/config.json`
    - Connect the mongo container
    - export port 3000
- Done!

## Suggestions and Tips
-   Chrome is recommended
-   Chrome top right corner `...` Select "Add to Home" for a native APP-like experience.
-   **We strongly recommend open an new account that can only play music on DSM**

## Supported sources
-   [DSM Audio Station](https://www.synology.com/dsm/feature/audio_station)
-   [Netease Cloud Music](https://music.163.com/)
    -   The module's lyric conversion function uses the API service of the [zhconvert](https://zhconvert.org/)

## Features
- Pinned Items
- Search
- Albums
- Recently added albums
- Folder
- Performers
- Composer
- Random Play
- Password Protection
- Night Mode
- Multi-User
- MediaSession

<img src="https://i.imgur.com/GOIe3va.png" width="500px">

## Contributors
![](https://contributors.nn.ci/api?repo=gnehs/PokaPlayer)
