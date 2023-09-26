const MongoClient = require('mongodb').MongoClient
const { ObjectId } = require('mongodb')
require('dotenv').config()

async function updateManyDocuments() {
    const url = process.env.DATABASE_URL
    const client = new MongoClient(url, { useUnifiedTopology: true })

    try {
        await client.connect();
        const db = client.db("test");
        const collection = db.collection("items")

        await collection.updateMany({}, { $set: { comment: [] } })

        const comments = [
            new ObjectId("6505437f18316f172bc29f1d"),
            new ObjectId("6505437f18316f172bc29f1e")
        ]

        // すべてのドキュメントに新しいプロパティ"newField"を追加し、その値を"newValue"に設定
        const result = await collection.updateMany({}, { $set: { comment: comments } })
        
        console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`)
    } finally {
        await client.close();
    }
}

updateManyDocuments().catch(console.error);
