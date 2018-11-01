"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Leaderboard {
    constructor(db) {
        this.db = db;
    }
    create(leaderboardId, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = this.getCollection(leaderboardId);
            const spec = (opts.ttl)
                ? { createdAt: 1 }
                : { expireAt: 1 };
            const options = (opts.ttl)
                ? { expireAfterSeconds: opts.ttl }
                : { expireAfterSeconds: 0 };
            yield collection.createIndex(spec, options);
            yield collection.createIndex({ score: -1 });
            yield collection.createIndex({ id: 1 });
        });
    }
    destroy(leaderboardId) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = this.getCollection(leaderboardId);
            yield collection.dropIndexes();
            return collection.drop();
        });
    }
    record(leaderboardId, record, expireAt) {
        const row = Object.assign({}, record);
        const id = row.id;
        delete row.id;
        const score = row.score;
        delete row.score;
        const update = {
            $max: { score: score },
            $setOnInsert: { createdAt: new Date() },
        };
        if (Object.keys(row).length > 0) {
            update.$set = row;
        }
        return new Promise((resolve, reject) => {
            this.getCollection(leaderboardId).
                findOneAndUpdate({ id }, update, { upsert: true }).
                then((r) => resolve(r.ok));
        });
    }
    list(leaderboardId, opts = { limit: 10, skip: 0 }) {
        return this.getCollection(leaderboardId).
            find({}).
            project({ _id: 0 }).
            sort({ score: -1 }).
            skip(opts.skip).
            limit(opts.limit).
            toArray();
    }
    get(leaderboardId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(leaderboardId).findOne({ id });
        });
    }
    count(leaderboardId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(leaderboardId).countDocuments();
        });
    }
    position(leaderboardId, id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.get(leaderboardId, id);
            return (yield this.getCollection(leaderboardId).
                find({
                score: {
                    $gt: user.score
                }
            }).
                count()) + 1;
        });
    }
    surrounding(leaderboardId, id, opts = { limit: 5 }) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = this.getCollection(leaderboardId);
            const user = yield collection.findOne({ id });
            const [before, after] = yield Promise.all([
                collection.
                    find({ id: { $ne: id }, score: { $lte: user.score } }).
                    project({ _id: 0 }).
                    sort({ score: -1 }).
                    limit(opts.limit).
                    toArray(),
                collection.
                    find({ id: { $ne: id }, score: { $gte: user.score } }).
                    project({ _id: 0 }).
                    sort({ score: 1 }).
                    limit(opts.limit).
                    toArray(),
            ]);
            return after.reverse().concat(user).concat(before);
        });
    }
    getCollection(leaderboardId) {
        return this.db.collection(`lb_${leaderboardId}`);
    }
}
exports.Leaderboard = Leaderboard;
