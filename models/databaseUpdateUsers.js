const MongoClient = require('mongodb').MongoClient
const { ObjectId } = require('mongodb')
require('dotenv').config()

async function updateManyDocuments() {
    const url = process.env.DATABASE_URL
    const client = new MongoClient(url, { useUnifiedTopology: true })

    try {
        await client.connect()
        const db = client.db("test")
        const usersCollection = db.collection("users")
        const itemsCollection = db.collection("items")

        const users = await usersCollection.find({}).toArray()

        for (let user of users) {
            // 各ユーザーの投稿を検索
            const posts = await itemsCollection.find({ userId: user._id }).toArray()

            // 投稿のObjectIdだけを抽出して配列にする
            const postIds = posts.map(post => post._id)
            console.log(`Updating posts for user ${user._id}: ${JSON.stringify(postIds)}`)


            // ユーザーのpostsフィールドを更新
            const result = await usersCollection.updateOne({ _id: user._id }, { $set: { posts: postIds } })
            console.log(`Updated ${result.modifiedCount} document(s) for user ${user._id}`)
        }

        // const result1 = await collection.updateMany({}, { $set: { "signature": signature } })
        // const result = await collection.updateMany({}, { $set: { "follow": follow } })
        // const result2 = await collection.updateMany({}, { $set: { "follower": follower } })
        
        // console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`)
        // console.log(`Matched ${result2.matchedCount} documents and modified ${result2.modifiedCount} documents.`)
    } finally {
        await client.close()
    }
}

updateManyDocuments().catch(console.error)


// const follow = [
//     new ObjectId("64f9a076d7a1008d94482b47"),
//     new ObjectId("64f9bc50e8643a50cd820ad8"),
//     new ObjectId("64f9854b368bba5a12b1923a"),
//     new ObjectId("650f698518bb9d79004fba26"),
//     new ObjectId("650f6f0318bb9d79004fba31"),
//     new ObjectId("650feb3b18bb9d79004fca7e"),
//     new ObjectId("65105df518bb9d79004fce0f"),
//     new ObjectId("652413179d6df254d4e386ef"),
// ]
// const follower = [
//     new ObjectId("64f9a076d7a1008d94482b47"),
//     new ObjectId("64f9bc50e8643a50cd820ad8"),
//     new ObjectId("64f9854b368bba5a12b1923a"),
//     new ObjectId("650f698518bb9d79004fba26"),
//     new ObjectId("650f6f0318bb9d79004fba31"),
//     new ObjectId("650feb3b18bb9d79004fca7e"),
//     new ObjectId("65105df518bb9d79004fce0f"),
//     new ObjectId("652413179d6df254d4e386ef"),
// ]
// const signature = "我が名はname、初めてこのAppを使う者！以後お見知り置きを！"