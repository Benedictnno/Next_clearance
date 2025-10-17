import { MongoClient } from "mongodb";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export function getMongoClient(): Promise<MongoClient> {
  if (clientPromise) return clientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  const isLocal = uri.includes("localhost") || uri.includes("127.0.0.1");

  client = new MongoClient(uri, {
    retryWrites: true,
    w: "majority",
    tls: !isLocal, // Automatically disable TLS locally
  });

  clientPromise = client.connect();
  return clientPromise;
}

export async function getDb(dbName = process.env.MONGODB_DB || "eksu_clearance") {
  const c = await getMongoClient();
  return c.db(dbName);
}
