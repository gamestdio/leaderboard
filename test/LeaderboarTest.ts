import { MongoClient, Db } from 'mongodb';
import { Leaderboard } from './../src/Leaderboard';
import * as assert from "assert";

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

    it("should create a new leaderboard", async () => {
        await leaderboard.create("daily", { ttl: 1 * 60 * 60 * 24 });
        const indexes = await db.collection("lb_daily").indexes();
        assert.equal(indexes.length, 3);
    });

    it("should drop leaderboard", async () => {
        await leaderboard.create("daily", { ttl: 1 * 60 * 60 * 24 });
        await leaderboard.destroy("daily");
    });

    it("should record score on leaderboard", async () => {
        const record = await leaderboard.record("daily", { id: "player1", score: 100 });
        assert.equal(record.id, "player1");
        assert.equal(record.score, 100);
    });

    it("should list scores from leaderboard", async () => {
        const name = "one_second_leaderboatrd";
        await leaderboard.create(name, { ttl: 1 });
        await leaderboard.record(name, { id: "player1", score: 1 });
        await leaderboard.record(name, { id: "player2", score: 20 });
        await leaderboard.record(name, { id: "player3", score: 33 });
        await leaderboard.record(name, { id: "player4", score: 10 });

        let scores = await leaderboard.list(name);
        assert.equal(scores[0].score, 33);
        assert.equal(scores[1].score, 20);
        assert.equal(scores[2].score, 10);
        assert.equal(scores[3].score, 1);
        await leaderboard.destroy(name);

        await new Promise((resolve, reject) => setTimeout(() => resolve(), 1000));
        let scoresAfterOneSecond = await leaderboard.list(name);
        assert.equal(scoresAfterOneSecond.length, 0);
    });
});