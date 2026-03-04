const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('eksu_clearance');
        const users = db.collection('users');

        console.log('Updating user roles to uppercase...');
        const result = await users.updateMany(
            { role: { $type: 'string' } },
            [{ $set: { role: { $toUpper: '$role' } } }]
        );
        console.log(`Updated ${result.modifiedCount} users.`);

        console.log('Cleaning up duplicate externalIds (setting null to unique string if multiple)...');
        // Find duplicates
        const pipeline = [
            { $match: { externalId: { $ne: null } } },
            { $group: { _id: '$externalId', count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 } } }
        ];
        const duplicates = await users.aggregate(pipeline).toArray();
        for (const dup of duplicates) {
            console.log(`Fixing duplicate externalId: ${dup._id}`);
            for (let i = 1; i < dup.ids.length; i++) {
                const id = dup.ids[i];
                await users.updateOne({ _id: id }, { $set: { externalId: `temp-${id}` } });
            }
        }

        // Fix duplicate emails
        const emailPipeline = [
            { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 } } }
        ];
        const emailDuplicates = await users.aggregate(emailPipeline).toArray();
        for (const dup of emailDuplicates) {
            console.log(`Fixing duplicate email: ${dup._id}`);
            for (let i = 1; i < dup.ids.length; i++) {
                const id = dup.ids[i];
                const newEmail = `${dup._id.split('@')[0]}-${i}@${dup._id.split('@')[1]}`;
                await users.updateOne({ _id: id }, { $set: { email: newEmail } });
            }
        }

        // Handle null duplicates separately if MongoDB unique index on null is NOT sparse
        const nullUsers = await users.find({ externalId: null }).toArray();
        if (nullUsers.length > 1) {
            console.log(`Found ${nullUsers.length} users with null externalId. Fixing...`);
            for (let i = 1; i < nullUsers.length; i++) {
                const id = nullUsers[i]._id;
                await users.updateOne({ _id: id }, { $set: { externalId: `null-${id}` } });
            }
        }

    } finally {
        await client.close();
    }
}

main().catch(console.error);
