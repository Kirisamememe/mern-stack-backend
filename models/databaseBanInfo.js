const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

async function createCollection() {
    const url = process.env.DATABASE_URL
    const client = new MongoClient(url, { useUnifiedTopology: true })

    try {
        await client.connect()
        const db = client.db("test")
        await db.createCollection("banInfos")

        console.log("BanInfo collection created.")

    } catch(err) {
        console.log(err)
    } finally {
        await client.close()
    }
}

createCollection().catch(console.error);
