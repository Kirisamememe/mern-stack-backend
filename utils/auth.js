const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/schemaModels");
const secret_key = "WhisperWave";

const auth = async (req, res, next) => {
    if (req.method === "GET") {
        return next();
    }
    
    const token = await req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(400).json({ message: "トークンがありません" })
    }

    try {
        const decoded = jwt.verify(token, secret_key)

        // email を使ってデータベースからユーザー情報を取得
        const userInfo = await UserModel.findOne({ email: decoded.email });

        if (!userInfo) {
            console.log("ユーザーが存在しません")
            return res.status(400).json({ message: "ユーザーが存在しません" });
        }
        
        req.body.email = decoded.email;
        req.body.userId = userInfo._id;
        
        console.log("認証成功")
        return next();
    } catch (error) {
        console.log("トークンが正しくないので、ログインしてください")
        return res.status(400).json({ message: "トークンが正しくないので、ログインしてください" });
    }
}

module.exports = auth;