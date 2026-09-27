import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add MONGODB_URI to .env.local");
}

/*
 * Fail fast instead of the driver's 30s default, so a DB blip
 * returns an error to the page rather than a hung request.
 */
const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 5_000,
  connectTimeoutMS: 10_000,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/*
 * One shared connection, kept on globalThis so dev hot reloads
 * reuse it. A failed connect is dropped, so the next request
 * retries instead of reusing the rejected promise until restart.
 */
const getMongoClient = (): Promise<MongoClient> => {
  if (!global._mongoClientPromise) {
    const promise = new MongoClient(uri, options).connect();

    global._mongoClientPromise = promise;

    promise.catch(() => {
      if (global._mongoClientPromise === promise) {
        global._mongoClientPromise = undefined;
      }
    });
  }

  return global._mongoClientPromise;
};

export default getMongoClient;
