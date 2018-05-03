import { Collection, Db } from 'mongodb';

export interface CreateOptions {
    ttl?: number;
}

export interface ListOptions {
    limit?: number;
}

export interface RecordOptions {
    score: number;
    expireAt?: number;
}

export class Leaderboard {
    private db: Db;

    constructor(db: Db) {
        this.db = db;
    }

    public async create(leaderboardId: string, opts?: CreateOptions): Promise<void> {
        const collection = this.getCollection(leaderboardId);

        const spec = (opts.ttl)
            ? { createdAt: 1 }
            : { expireAt: 1 };

        const options = (opts.ttl)
            ? { expireAfterSeconds: opts.ttl }
            : { expireAfterSeconds: 0 };

        await collection.createIndex(spec, options);
        await collection.createIndex({ score: -1 });
    }

    public destroy(leaderboardId: string) {
        return this.getCollection(leaderboardId).drop();
    }

    public record(leaderboardId: string, row: any & RecordOptions, expireAt?: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.getCollection(leaderboardId).
                insert(row).
                then((value) => resolve(value.ops[0]));
        });
    }

    public list(leaderboardId: string, opts: ListOptions = { limit: 10 }) {
        const collection = this.getCollection(leaderboardId);
        const cursor = collection.find({});
        cursor.sort({ score: -1 });
        cursor.limit(opts.limit);
        return cursor.toArray();
    }

    protected getCollection(leaderboardId: string) {
        return this.db.collection(`lb_${leaderboardId}`);
    }
}
