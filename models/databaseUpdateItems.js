const MongoClient = require('mongodb').MongoClient
const { ObjectId } = require('mongodb')
require('dotenv').config()

async function updateManyDocuments() {
    const url = process.env.DATABASE_URL
    const client = new MongoClient(url, { useUnifiedTopology: true });

    try {
        await client.connect();
        const db = client.db("test");

        // 1. 既存のコメントデータの削除
        const itemCollection = db.collection("items");
        await itemCollection.updateMany({}, { $unset: { comment: "" } });

        // 2. 新しい `Comment` ドキュメントの作成
        const commentCollection = db.collection('comments');
        const newComment1 = await commentCollection.insertOne({
            user: new ObjectId("64f9a076d7a1008d94482b47"),
            commentText: 'イチコメ！',
            like: [
                {userId: new ObjectId("64f9854b368bba5a12b1923a")},
                {userId: new ObjectId("64f9bc50e8643a50cd820ad8")}
            ],
            date: new Date()
        });
        const newComment2 = await commentCollection.insertOne({
            user: new ObjectId("64f9a076d7a1008d94482b47"),
            commentText: '我が名はめぐみん！アークウィザードを生業とし、最強の攻撃魔法〈爆裂魔法〉を操りし者！',
            like: [
                {userId: new ObjectId("64f9854b368bba5a12b1923a")},
                {userId: new ObjectId("64f9bc50e8643a50cd820ad8")}
            ],
            date: new Date() 
        });
        // MongoDBでは、db.collection('comments') とすると、
        // 指定した名前のコレクション（この場合は 'comments'）にアクセスするためのハンドルを取得。
        // もしそのコレクションがまだ存在しない場合、MongoDBは動的にそのコレクションを作成。
        //（最初にそのコレクションにドキュメントが挿入されるタイミングで）


        // 3. `Item` と `Comment` のリンク
        const commentId = [newComment1.insertedId, newComment2.insertedId];
        const result = await itemCollection.updateMany({}, { $push: { comment: commentId } });

        
        console.log(`Matched ${result.matchedCount} documents and modified ${result.modifiedCount} documents.`);
    } finally {
        await client.close();
    }
}

updateManyDocuments().catch(console.error);
