const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
require('dotenv').config()

async function updateManyDocuments() {
    const url = process.env.DATABASE_URL
    const client = new MongoClient(url, { useUnifiedTopology: true })

    try {
        await client.connect()
        const db = client.db("test")
        const collection = db.collection("comments")

        await collection.updateMany({}, { $set: { "subComments": [] } })
        // await collection.updateMany({}, { $set: { "like": [] } })

        // const like = [
        //     new ObjectId("64f9854b368bba5a12b1923a"),
        //     new ObjectId("64f9bc50e8643a50cd820ad8")
        // ]

        const subComments = [
            {
                user: new ObjectId("64f9bc50e8643a50cd820ad8"),
                like: [
                    new ObjectId("64f9854b368bba5a12b1923a"),
                    new ObjectId("64f9bc50e8643a50cd820ad8")
                ],
                commentText: "もう恥ずかしいこと言わないでよ！",
                date: new Date()
            },
            {
                user: new ObjectId("64f9bc50e8643a50cd820ad8"),
                like: [
                    new ObjectId("64f9854b368bba5a12b1923a"),
                    new ObjectId("64f9bc50e8643a50cd820ad8")
                ],
                commentText: "はぁ。どうしてこうなっちゃうんだろう。",
                date: new Date()
            }
        ]

        // すべてのドキュメントに新しいプロパティ"newField"を追加し、その値を"newValue"に設定
        const result = await collection.updateMany({}, { $set: { "subComments": subComments } })
        // const result2 = await collection.updateMany({}, { $set: { "like": like } })
        
        console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`)
    } finally {
        await client.close()
    }
}

updateManyDocuments().catch(console.error)
