const expect = require("chai").expect;

const Netease2 = require("../dataModule/netease2.js");

const songs = {
    ids: [435552097, 1293905031],
    names: ["RAGE OF DUST", "月の姫"]
};

before(done => expect(Netease2.onLoaded()).to.eventually.be.true.notify(done));

describe("獲取歌曲", () => {
    it("getSongsUrl 回傳歌曲的 URL", async done => {
        try {
            expect(await Netease2.getSongsUrl(songs.ids)).to.satisfy(data =>
                data.every(x => x.url.includes("http") && x.url.endsWith(".mp3"))
            );
        } catch (e) {
            done(e);
        }
    });

    it("getSongs 回傳歌曲資訊", async done => {
        try {
            expect(await getSongs(songs.ids)).to.satisfy(data =>
                data.every(x => songs.names.includes(x.name))
            );
        } catch (e) {
            done(e);
        }
    });
});
