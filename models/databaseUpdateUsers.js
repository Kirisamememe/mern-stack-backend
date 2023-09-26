const MongoClient = require('mongodb').MongoClient
const { ObjectId } = require('mongodb')
require('dotenv').config()

async function updateManyDocuments() {
    const url = process.env.DATABASE_URL
    const client = new MongoClient(url, { useUnifiedTopology: true })

    try {
        await client.connect();
        const db = client.db("test");
        const collection = db.collection("users");

        await collection.updateMany({}, { $unset: { collect: "" } })

        const collect = [
            {
                _id: new ObjectId(),
                itemId: new ObjectId("64f9a29ee8643a50cd820acb"),
                date: new Date()
            }
        ]

        // すべてのドキュメントに新しいプロパティ"newField"を追加し、その値を"newValue"に設定
        const result = await collection.updateMany({}, { $set: { "collect": collect } });
        
        console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`)
    } finally {
        await client.close();
    }
}

updateManyDocuments().catch(console.error);
