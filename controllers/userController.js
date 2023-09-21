const jwt = require("jsonwebtoken");
const connectDB = require("../models/database");
const { UserModel, CodeModel } = require("../models/schemaModels");

// USER functions
//Read User
exports.readUser = async (req, res) => {
    try {
        await connectDB()
        const user = await UserModel.findById(req.params.userId)

        if (!user) {
            console.log("チェックポイント1")
            return res.status(400).json({ message: "ユーザーが存在しません" })
        }

        // const userInfo = user.toObject()
        const collect = user.collect
        return res.status(200).json({ message: "ユーザ情報読み取り成功", collect: collect })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: "ユーザー情報を読み取れませんでした" })
    }
}

// Register User
exports.register = async(req, res) => {
    try{
        await connectDB();
        const codeDocument = await CodeModel.findOne({})
        const codeArray = codeDocument.code

        if (!codeArray.includes(req.body.code)) {
            return res.status(400).json({ message: "現在は招待された方しか登録できません" });
        }

        const index = codeDocument.code.indexOf(req.body.code);
        codeDocument.code.splice(index, 1)
        await codeDocument.save();

        const existingUsersCount = await UserModel.countDocuments({});
        if (existingUsersCount >= 20) {
            console.log("ユーザー数が上限に達しています")
            return res.status(400).json({ message: "ユーザー数が上限に達しています" });
        }

        if (!req.body.email.includes("@") || req.body.password.length < 8 || req.body.password.length > 16) {
            return res.status(400).json({ message: "入力が正しくありません" });
        }

        console.log(req.body);
        await UserModel.create(req.body);

        return res.status(200).json({ message: "ユーザー登録成功" })
    }catch(err) {
        return res.status(500).json({ message: "ユーザー登録失敗" })
    }
}

// Login User
const secret_key = "WhisperWave";

exports.login = async(req, res) => {
    try{
        await connectDB();
        const saveUserData = await UserModel.findOne({ email: req.body.email });
        if (saveUserData) {
            if (req.body.password === saveUserData.password) {
                const payload = {
                    email: req.body.email,
                }
                const token = jwt.sign(payload, secret_key, {expiresIn: "23h"});

                return res.status(200).json({ 
                    message: "ログイン成功",
                    token: token,
                    avatar: saveUserData.avatar,
                    userId: saveUserData._id,
                    userName: saveUserData.name
                });
                
            }
            else {
                return res.status(400).json({ message: "ログイン失敗：アカウントかパスワードが間違っています" });
            }
        }
        else {
            return res.status(400).json({ message: "ログイン失敗：アカウントかパスワードが間違っています" });
        }
        
    }catch(err) {
        return res.status(400).json({ message: "ログイン失敗" });
    }
}

// Logout User
exports.logout =  (req, res) => {
    // Token blacklist logic here
    return res.status(200).json({ message: "ログアウト成功" });
}