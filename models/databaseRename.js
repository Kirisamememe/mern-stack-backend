const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

async function updateManyDocuments() {
    const url = process.env.DATABASE_URL
    const client = new MongoClient(url, { useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db("test");
        const collection = db.collection("items");

        const query = {};  // すべてのドキュメントに適用
        const update = { $rename: { "description": "mainBody" } };
        
        const result = await collection.updateMany(query, update);
        
        console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`);
    } finally {
        await client.close();
    }
}

updateManyDocuments().catch(console.error);
