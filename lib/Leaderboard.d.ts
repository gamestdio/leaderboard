import { Collection, Db } from 'mongodb';
import { ListOptions } from './Leaderboard';
export interface CreateOptions {
    ttl?: number;
}
export interface ListOptions {
    limit?: number;
    skip?: number;
}
export interface RecordOptions {
    id: any;
    score: number;
    expireAt?: number;
}
export declare class Leaderboard {
    private db;
    constructor(db: Db);
    create(leaderboardId: string, opts?: CreateOptions): Promise<void>;
    destroy(leaderboardId: string): Promise<any>;
    record(leaderboardId: string, record: any & RecordOptions, expireAt?: number): Promise<any>;
    list(leaderboardId: string, opts?: ListOptions): Promise<any[]>;
    get(leaderboardId: string, id: any): Promise<any>;
    count(leaderboardId: string): Promise<number>;
    position(leaderboardId: string, id: any): Promise<number>;
    surrounding(leaderboardId: string, id: any, opts?: ListOptions): Promise<any[]>;
    protected getCollection(leaderboardId: string): Collection<any>;
}
