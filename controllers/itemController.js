const { default: mongoose } = require("mongoose")
const connectDB = require("../models/database")
const { ItemModel, UserModel, CommentModel } = require("../models/schemaModels")

// ITEM functions
// Read All Items
exports.readAllItem = async (req, res) => {
    try{
        connectDB()
        const allItems = await ItemModel.find().sort({ date: -1 })
        return res.status(200).json({ message: "アイテム読み取り成功（オール）", allItems: allItems })
    }catch(err) {
        return res.status(400).json({ message: "アイテム読み取り失敗（オール）" })
    }
}

// Read Single Item
exports.readSingleItem = async (req, res) => {
    try{
        await connectDB()
        // const skip = parseInt(req.query.skip) || 0
        // const limit = parseInt(req.query.limit) || 10

        const singleItem = await ItemModel.findById(req.params.id)

        if (!singleItem) {
            return res.status(400).json({ message: "アイテムが存在しません" })
        }

        const fields = req.query.fields ? req.query.fields.split(',') : []
        console.log(fields)
        if (fields.length > 0) {
            let itemInfo = {}
            
            fields.forEach(field => {
                if (singleItem[field] !== undefined) {
                    itemInfo[field] = singleItem[field]
                }
            })

            console.log(itemInfo)
            return res.status(200).json({ message: "アイテム情報読み取り成功", itemInfo: itemInfo })
        }

        //投稿者のユーザー名取得
        //userの情報をオブジェクトで取得
        const user = await UserModel.findById(singleItem.userId)
        

        //データベース用のオブジェクトを通常のオブジェクトに変換
        const singleItemObject = singleItem.toObject()

        
        singleItemObject.name = user ? user.name : "Unknown User"

        //コメント情報を取得
        //とりあえずcommentIdを全部取得
        const comments = await CommentModel.find({ '_id': { $in: singleItemObject.comment } })
        .sort({ date: -1 })
        // .skip(skip).limit(limit)

        const populatedComments = await Promise.all(comments.map(async (comment) => {
            const commentUser = await UserModel.findById(comment.userId)
            const populatedSubComments = await Promise.all(comment.subComments.map(async (subComment) => {
                const subCommentUser = await UserModel.findById(subComment.userId)
                return {
                    commentId: subComment._id,
                    commentText: subComment.commentText,
                    date: subComment.date,
                    like: subComment.like,
                    userId: subComment.userId,
                    userName: subCommentUser ? subCommentUser.name : "Unknown User",
                    userAvatar: subCommentUser ? subCommentUser.avatar : null,
                }
            }))
            populatedSubComments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

            return {
                commentId: comment._id,
                commentText: comment.commentText,
                date: comment.date,
                like: comment.like,
                userId: comment.userId,
                userName: commentUser ? commentUser.name : "Unknown User",
                userAvatar: commentUser ? commentUser.avatar : null,
                subComments: populatedSubComments
            }
        }))

        singleItemObject.comments = populatedComments

        
        // console.log(JSON.stringify(singleItemObject, null, 2))
        return res.status(200).json({ message: "アイテム読み取り成功（シングル）", singleItem: singleItemObject })
    }catch(err) {
        return res.status(400).json({ message: "アイテム読み取り失敗（シングル）" })
    }
}

//いいね
exports.like = async (req, res) => {
    try {
        await connectDB()
        const item = await ItemModel.findById(req.params.id)
        const userId = req.body.userId

        if (!item) {
            return res.status(400).json({ message: "アイテムが存在しません" })
        }
        
        //配列内のuserIdをユニークにする
        await ItemModel.updateOne(
            { _id: item._id },
            { $addToSet: { like: userId } }
        )
    
        return res.status(200).json({ message: "いいね成功" })
    } catch(err) {
        console.log(err)
        return res.status(400).json({ message: "いいね失敗" })
    }
}

//いいね取り消し
exports.unLike = async (req, res) => {
    try {
        await connectDB()
        const userId = await req.body.userId
        const item = await ItemModel.findById(req.params.id)

        if (!item) {
            return res.status(400).json({ message: "アイテムが存在しません" })
        }

        await ItemModel.updateOne(
            { _id: item._id },
            { $pull: { like: userId } }
        )
        // console.log("ここまできた1")
        return res.status(200).json({ message: "いいねを取り消しました" })
    } catch(err) {
        console.log(err)
        return res.status(400).json({ message: "エラーが発生しました" })
    }
    // return res.status(400).json({ message: "エラーが発生しました" })
}

//コメント
exports.comment = async (req, res) => {
    try {
        await connectDB()
        if (req.body.commentText.length > 1000) {
            console.log(req.body.commentText.length)
            return res.status(400).json({ message: "800文字以内で入力してください" })
        }
        //コメントを作成
        const newComment = new CommentModel({
            userId: req.body.userId,
            like: [],
            commentText: req.body.commentText,
            subComments: []
        })
        await newComment.save()

        //コメントが関連するアイテムを取得
        const item = await ItemModel.findById(req.params.id)

        if (!item) {
            return res.status(400).json({ message: "アイテムが存在しません" })
        }

        item.comment.push(newComment._id)

        await item.save()

        return res.status(200).json({ message: "コメントを投稿しました" })
    } catch(err) {
        console.log(err)
        return res.status(400).json({ message: "コメントを投稿できませんでした" })
    }
}

//コメントいいね
exports.likeComment = async (req, res) => {
    console.log("チェックポイント1")
    try {
        await connectDB()
        const { commentId, action } = req.params

        const comment = await CommentModel.findById(commentId)
        const userId = req.body.userId
        console.log("チェックポイント2")

        if (!comment) {
            console.log(comment)
            return res.status(400).json({ message: "アイテムが存在しません" })
        }

        if (action === "like") {
            //配列内のuserIdをユニークにする
            await CommentModel.updateOne(
                { _id: comment._id },
                { $addToSet: { like: userId } }
            )
    
            return res.status(200).json({ message: "いいね成功" })
        }
        else if(action === "unlike") {
            await CommentModel.updateOne(
                { _id: comment._id },
                { $pull: { like: userId } }
            )

            return res.status(200).json({ message: "いいね取り消し成功" })
        }
        
    } catch(err) {
        console.log(err)
        return res.status(400).json({ message: "いいね失敗" })
    }
}


//サブコメント作成
exports.subComment = async (req, res) => {
    try {
        await connectDB()
        if (req.body.commentText.length > 200) {
            console.log(req.body.commentText.length)
            return res.status(400).json({ message: "200文字以内で入力してください" })
        }

        const subComment = {
            userId: req.body.userId,
            like: [],
            commentText: req.body.commentText,
            date: new Date()
        }

        const comment = await CommentModel.findById(req.body.commentId)

        if (!comment) {
            return res.status(400).json({ message: "コメントが存在しません" })
        }

        comment.subComments.push(subComment)
        await comment.save()

        return res.status(200).json({ message: "コメントを投稿しました" })
    } catch (error) {
        return res.status(400).json({ message: "コメントを投稿できませんでした" })
    }
}

//サブコメントいいね
exports.likeSubComment = async (req, res) => {
    try {
        await connectDB()
        const { commentId, subCommentId, action } = req.params

        const comment = await CommentModel.findById(commentId)
        const userId = req.body.userId

        if (!comment) {
            return res.status(400).json({ message: "アイテムが存在しません" })
        }

        if (action === "like") {
            //配列内のuserIdをユニークにする
            await CommentModel.updateOne(
                { _id: comment._id, "subComments._id": subCommentId },
                { $addToSet: { "subComments.$.like": userId } }
            )
    
            return res.status(200).json({ message: "いいね成功" })
        }
        else if(action === "unlike") {
            await CommentModel.updateOne(
                { _id: comment._id, "subComments._id": subCommentId },
                { $pull: { "subComments.$.like": userId } }
            )

            return res.status(200).json({ message: "いいね取り消し成功" })
        }
        
    } catch(err) {
        console.log(err)
        return res.status(400).json({ message: "いいね失敗" })
    }
}

//コメント削除
exports.deleteComment = async (req, res) => {
    try {
        await connectDB()

        const item = await ItemModel.findById(req.params.id)
        const comment = await CommentModel.findById(req.params.commentId)

        if (!item || !comment) {
            return res.status(400).json({ message: "操作する対象が存在しません" })
        }

        // 対象のコメントIDを特定。req.body.commentIdはフロントエンドから送られてくる必要がある
        const commentId = req.params.commentId

        // コメントを削除
        // ダミーデータが減ると困るので、今のところは実際に削除しない
        // 本実装の時にコメントアウトを解除する
        // await CommentModel.findByIdAndDelete(commentId)

        // アイテムのcommentフィールドから削除したコメントIDを除去
        const index = item.comment.indexOf(commentId)
        if (index > -1) {
            item.comment.splice(index, 1)
        }

        // アイテムを更新
        await item.save()

        return res.status(200).json({ message: "コメント削除成功" })
    } catch(err) {
        return res.status(400).json({ message: "コメント削除失敗" })
    }
}


//サブコメント削除
exports.deleteSubComment = async (req, res) => {
    try {
        await connectDB()

        const commentId = req.params.commentId
        const subCommentId = req.params.subCommentId

        const comment = await CommentModel.findById(commentId)

        if (!comment) {
            return res.status(400).json({ message: "操作する対象が存在しません" })
        }

        //検索して削除
        await CommentModel.updateOne(
            { _id: commentId },
            { $pull: { subComments: { _id: subCommentId } } }
        )

        return res.status(200).json({ message: "コメント削除成功" })
    } catch(err) {
        return res.status(400).json({ message: "コメント削除失敗" })
    }
}

//コレクト
exports.collect = async (req, res) => {
    //トランザクション処理を開始
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        await connectDB()
        const item = await ItemModel.findById(req.params.id).session(session)
        const user = await UserModel.findById(req.body.userId).session(session)

        if (!item || !user) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({ message: "アイテムまたはユーザーが存在しません" })
        }
        
        const collect = {
            itemId: item._id,
            date: new Date()
        }

        await ItemModel.updateOne({ _id: item._id }, { $inc: { collect: 1 } }).session(session)
        await UserModel.updateOne({ _id: user._id }, { $push: { collect: collect } }).session(session)

        await session.commitTransaction()
        session.endSession()

        return res.status(200).json({ message: "コレクト成功" })
    } catch(err) {
        return res.status(400).json({ message: "コレクト失敗" })
    }
}

//コレクト取り消し
exports.deCollect = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const item = await ItemModel.findById(req.params.id).session(session)
        const user = await UserModel.findById(req.body.userId).session(session)

        if (!item || !user) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({ message: "アイテムまたはユーザーが存在しません" })
        }
        
        await ItemModel.updateOne({ _id: item._id }, { $inc: { collect: -1 } }).session(session)
        await UserModel.updateOne({ _id: user._id }, { $pull: { collect: { itemId: item._id} } }).session(session)

        await session.commitTransaction()
        session.endSession()

        return res.status(200).json({ message: "コレクト取り消し成功" })
    } catch(err) {
        await session.abortTransaction()
        session.endSession()
        return res.status(400).json({ message: "コレクト取り消し失敗", error: err })
    }
}


// Create Item
exports.createItem = async (req, res) => {
    try{
        await connectDB()
        
        if (req.body.mainBody.length > 5000) {
            return res.status(400).json({ message: "文字数制限を超えています" })
        }

        const user = await UserModel.findById(req.body.userId)
        if (!user) {
            return res.status(400).json({ message: "ユーザーが存在しません" })
        }

        console.log(req.body)

        const newItem = await ItemModel.create(req.body)
        const newItemId = newItem._id

        user.posts.push(newItemId)
        await user.save()

        return res.status(200).json({ message: "アイテム作成成功" })
    } catch(err) {
        console.log(err)
        return res.status(500).json({ message: "アイテム作成失敗" })
    }
}


// Update Item
exports.updateItem = async (req, res) => {
    try{
        await connectDB()

        const singleItem = await ItemModel.findById(req.params.id)

        //ここ注意！.toString()しないと、型の不一致でfalseになってしまう
        if (singleItem.email === req.body.email && singleItem.userId.toString() === req.body.userId.toString()) {
            await ItemModel.updateOne({ _id: req.params.id }, req.body)
            return res.status(200).json({ message: "アイテム編集成功（シングル）" })
        }
        else {
            throw new Error()
        }
    }catch(err) {
        return res.status(400).json({ message: "アイテム編集失敗（シングル）" })
    }
}

// Delete Item
exports.deleteItem = async (req, res) => {
    try{
        await connectDB()
        await ItemModel.deleteOne({ _id: req.params.id })
        return res.status(200).json({ message: "アイテム削除成功" })
    }catch(err) {
        return res.status(400).json({ message: "アイテム削除失敗" })
    }
}
