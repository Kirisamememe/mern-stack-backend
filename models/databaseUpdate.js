const MongoClient = require('mongodb').MongoClient
require('dotenv').config()
const { ObjectId } = require('mongodb')

async function updateManyDocuments() {
    const url = process.env.DATABASE_URL
    const client = new MongoClient(url, { useUnifiedTopology: true })

    try {
        await client.connect()
        const db = client.db("test")
        const collection = db.collection("items")


        // すべてのドキュメントに新しいプロパティ"newField"を追加し、その値を"newValue"に設定
        const result = await collection.updateMany({}, { $set: { like: [] } })
        
        console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`)
    } finally {
        await client.close()
    }
}

updateManyDocuments().catch(console.error)
