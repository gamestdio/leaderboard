# @gamestdio/leaderboard

Minimalist Leaderboard Module for Node.js using MongoDB.

This module uses [MongoDB's TTL feature](https://docs.mongodb.com/manual/tutorial/expire-data/) in order to avoid maintenance of leaderboard records.

*Note: It would be nice to have support for multiple databases, such as MySQL, Postgres, etc. Pull-requests are welcome!*

## Usage

### Installation

```
npm install mongodb
npm install @gamestdio/leaderboard
```

### Import and set up

```typescript
import { MongoClient } from "mongodb";
import { Leaderboard } from "@gamestdio/leaderboard";

// Setup your MongoDB connection.
const client = new MongoClient("mongodb://...");
const db = client.db("your_database");

// Initialize the leaderboard.
const leaderboard = new Leaderboard(db);
```

### Creating a leaderboard

You may have as many leaderboards as you'd like to.

```typescript
// creating a daily leaderboard (records are removed after 24h)
leaderboard.create("day", { ttl: 1 * 60 * 60 * 24 });

// creating a daily leaderboard (records are removed after 7 days)
leaderboard.create("week", { ttl: 1 * 60 * 60 * 24 * 7 });

// creating a montly leaderboard (records are removed after 30 days)
leaderboard.create("month", { ttl: 1 * 60 * 60 * 24 * 30 });
```

### Inserting scores into the leaderboard

```typescript
leaderboard.store("day", { id: "unique user id here", score: 50 });
```

### Querying for scores

```typescript
leaderboard.list("day").then((rows) => {
    console.log(rows);
});
```

### Getting exact position of player

```typescript
leaderboard.position("day", "unique user id here").then((position) => {
    console.log(position) // => 1 ~ 9999...
});
```

### Get scores surrounding player

```typescript
leaderboard.surrounding("day", "unique user id here", { limit: 3 }).then((scores) => {
    console.log(scores) ; /* => [
        { id: 'player7', score: 60, createdAt: 2018-05-04T02:54:55.836Z },
        { id: 'player3', score: 50, createdAt: 2018-05-04T02:54:55.825Z },
        { id: 'player2', score: 30, createdAt: 2018-05-04T02:54:55.824Z },
        { id: 'unique user id here', score: 25, createdAt: 2018-05-04T02:54:55.826Z },
        { id: 'player1', score: 10, createdAt: 2018-05-04T02:54:55.823Z },
        { id: 'player6', score: 3, createdAt: 2018-05-04T02:54:55.828Z },
        { id: 'player5', score: 1, createdAt: 2018-05-04T02:54:55.827Z }
    ]*/
}),
```


## License

MIT
