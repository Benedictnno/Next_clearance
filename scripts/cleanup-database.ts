
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("MONGODB_URI not found in environment");
    process.exit(1);
}

async function cleanup() {
    const client = new MongoClient(uri!);
    try {
        await client.connect();
        const db = client.db('eksu_clearance');
        const col = db.collection('clearances');

        // Find documents with null or missing submissionKey
        const query = {
            $or: [
                { submissionKey: null },
                { submissionKey: { $exists: false } }
            ]
        };

        const count = await col.countDocuments(query);
        console.log(`Found ${count} invalid records (missing submissionKey)`);

        if (count > 0) {
            const result = await col.deleteMany(query);
            console.log(`Successfully deleted ${result.deletedCount} invalid records.`);
        } else {
            console.log("No cleanup needed.");
        }
    } catch (e: any) {
        console.error('Cleanup failed:', e.message);
    } finally {
        await client.close();
    }
}

cleanup();
