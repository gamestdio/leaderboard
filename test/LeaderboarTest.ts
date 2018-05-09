import { MongoClient, Db } from 'mongodb';
import { Leaderboard } from './../src/Leaderboard';
import * as assert from "assert";

const TEST_LEADERBOARD = "daily";

describe("Leaderboard", () => {
    let client: MongoClient;
    let db: Db;
    let leaderboard: Leaderboard;

    before(async () => {
        client = new MongoClient("mongodb://127.0.0.1:27017")
        await client.connect();
        db = client.db("colyseus_leaderboard");

        leaderboard = new Leaderboard(db);
    });

    // close mongodb connection
    after(() => client.close());

    beforeEach(async () => await leaderboard.create(TEST_LEADERBOARD, { ttl: 1 * 60 * 60 * 24 }));
    afterEach(async () => await leaderboard.destroy(TEST_LEADERBOARD));

    it("should create a new leaderboard", async () => {
        await leaderboard.create(TEST_LEADERBOARD, { ttl: 1 * 60 * 60 * 24 });
        const indexes = await db.collection(`lb_${TEST_LEADERBOARD}`).indexes();
        assert.equal(indexes.length, 4);
    });

    it("should drop leaderboard", async () => {
        await leaderboard.create("dummy", { ttl: 1 * 60 * 60 * 24 });
        await leaderboard.destroy("dummy");
    });

    it("should record score on leaderboard", async () => {
        const record = await leaderboard.record(TEST_LEADERBOARD, { id: "player1", score: 100 });
        const scores = await leaderboard.list(TEST_LEADERBOARD);
        assert.equal(scores[0].id, "player1");
        assert.equal(scores[0].score, 100);
    });

    it("should increase user's score only if score is higher", async () => {
        await leaderboard.record(TEST_LEADERBOARD, { id: "player1", score: 100 });
        const record = await leaderboard.record(TEST_LEADERBOARD, { id: "player2", score: 100 });
        const record2 = await leaderboard.record(TEST_LEADERBOARD, { id: "player2", score: 102 });
        const scores = await leaderboard.list(TEST_LEADERBOARD);
        assert.equal(scores[0].id, "player2");
        assert.equal(scores[0].score, 102);
        assert.equal(scores[1].id, "player1");
        assert.equal(scores[1].score, 100);
    });

    it("should compute position of user based on its id", async () => {
        await leaderboard.record(TEST_LEADERBOARD, { id: "player1", score: 10 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player2", score: 30 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player3", score: 50 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player4", score: 25 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player5", score: 1 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player6", score: 3 });

        assert.equal(await leaderboard.position(TEST_LEADERBOARD, "player3"), 1);
        assert.equal(await leaderboard.position(TEST_LEADERBOARD, "player2"), 2);
        assert.equal(await leaderboard.position(TEST_LEADERBOARD, "player4"), 3);
        assert.equal(await leaderboard.position(TEST_LEADERBOARD, "player1"), 4);
        assert.equal(await leaderboard.position(TEST_LEADERBOARD, "player6"), 5);
        assert.equal(await leaderboard.position(TEST_LEADERBOARD, "player5"), 6);
    });

    it("should list surrounding scores", async () => {
        await leaderboard.record(TEST_LEADERBOARD, { id: "player1", score: 10 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player2", score: 30 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player3", score: 50 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player4", score: 25 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player5", score: 1 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player6", score: 3 });
        await leaderboard.record(TEST_LEADERBOARD, { id: "player7", score: 60 });

        const surrounding = await leaderboard.surrounding(TEST_LEADERBOARD, "player4", { limit: 1 });
        assert.equal(surrounding[0].score, 30)
        assert.equal(surrounding[1].score, 25)
        assert.equal(surrounding[2].score, 10)
        assert.equal(surrounding.length, 3);

        const surrounding2 = await leaderboard.surrounding(TEST_LEADERBOARD, "player4", { limit: 2 });
        assert.equal(surrounding2[0].score, 50)
        assert.equal(surrounding2[1].score, 30)
        assert.equal(surrounding2[2].score, 25)
        assert.equal(surrounding2[3].score, 10)
        assert.equal(surrounding2[4].score, 3)
        assert.equal(surrounding2.length, 5);

        const surrounding3 = await leaderboard.surrounding(TEST_LEADERBOARD, "player4", { limit: 3 });
        assert.equal(surrounding3[0].score, 60)
        assert.equal(surrounding3[1].score, 50)
        assert.equal(surrounding3[2].score, 30)
        assert.equal(surrounding3[3].score, 25)
        assert.equal(surrounding3[4].score, 10)
        assert.equal(surrounding3[5].score, 3)
        assert.equal(surrounding3[6].score, 1)
        assert.equal(surrounding3.length, 7);
    });

    it("shouldn't error by creating the same leaderboard multiple times", (done) => {
        const name = "testing";

        assert.doesNotThrow(async () => {
            await leaderboard.create(name, { ttl: 1 });
            await leaderboard.create(name, { ttl: 1 });
            await leaderboard.create(name, { ttl: 1 });
            await leaderboard.create(name, { ttl: 1 });
            await leaderboard.create(name, { ttl: 1 });
            await leaderboard.destroy(name);
            done();
        });
    });

    it("shouldn't error by creating the same leaderboard multiple times", (done) => {
        const name = "testing";

        assert.doesNotThrow(async () => {
            await leaderboard.create(name, { ttl: 1 });
            await leaderboard.create(name, { ttl: 1 });
            await leaderboard.create(name, { ttl: 1 });
            await leaderboard.create(name, { ttl: 1 });
            await leaderboard.create(name, { ttl: 1 });
            await leaderboard.destroy(name);
            done();
        });
    });

    xit("should list scores from leaderboard (this test takes a minute to resolve)", async () => {
        const name = "one_second_leaderboard";
        await leaderboard.create(name, { ttl: 0.0001 });
        await leaderboard.record(name, { id: "player1", score: 1 });
        await leaderboard.record(name, { id: "player2", score: 20 });
        await leaderboard.record(name, { id: "player3", score: 33 });
        await leaderboard.record(name, { id: "player4", score: 10 });

        const scores = await leaderboard.list(name);
        assert.equal(scores[0].score, 33);
        assert.equal(scores[1].score, 20);
        assert.equal(scores[2].score, 10);
        assert.equal(scores[3].score, 1);

        await new Promise((resolve, reject) => setTimeout(() => resolve(), 1000 * 60));
        let scoresAfterOneSecond = await leaderboard.list(name);
        assert.equal(scoresAfterOneSecond.length, 0);

        await leaderboard.destroy(name);
    }).timeout(1200 * 60);

});