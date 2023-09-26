const mongoose = require("mongoose")

const Schema = mongoose.Schema

// 子スキーマは親スキーマより先に定義されてなければならない！！！
// 子スキーマは親スキーマより先に定義されてなければならない！！！
// 子スキーマは親スキーマより先に定義されてなければならない！！！
const SubCommentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    like: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    commentText: String,
    date: { type: Date, default: Date.now }
})

const CommentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    like: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    commentText: String,
    subComments: [SubCommentSchema],
    date: { type: Date, default: Date.now }
});

const ItemSchema = new Schema({
    title: String,
    image: String,
    date: { type: Date, default: Date.now },
    mainBody: String,
    email: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    like: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    collect: Number,
    comment: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]
})

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: false
    },
    collect: [
        {
            itemId: { type: Schema.Types.ObjectId, ref: 'Item' },
            date: { type: Date, default: Date.now },
        }
    ]
})

const CodeSchema = new Schema({
    code: [String]
})


const BanInfoSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        unique: true,
        required: true,
        ref: 'User' 
    },
    failCount: {
        type: Number,
        default: 0
    },
    blockUntil: {
        type: Date,
        default: 0
    }
})


exports.ItemModel = mongoose.model("Item", ItemSchema)
exports.UserModel = mongoose.model("User", UserSchema)
exports.CommentModel = mongoose.model("Comment", CommentSchema)
exports.CodeModel = mongoose.model("Code", CodeSchema)
exports.BanInfoModel = mongoose.model("BanInfo", BanInfoSchema)