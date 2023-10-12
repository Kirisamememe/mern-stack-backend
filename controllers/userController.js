const jwt = require("jsonwebtoken")
const connectDB = require("../models/database")
const { default: mongoose } = require("mongoose")
const { UserModel, CodeModel, BanInfoModel } = require("../models/schemaModels")
const { use } = require("../routes/userRoutes")

// USER functions
const rateLimitMap = new Map()
const BLOCK_TIME = 24 * 60 * 60 * 1000
const IP_BLOCK_TIME = 3650 * 24 * 60 * 60 * 1000
const GLOBAL_LIMIT = 50
const ONE_DAY = 24 * 60 * 60 * 1000

let globalCount = 0

setInterval(() => {
    globalCount = 0
}, ONE_DAY)

const incrementGlobalCount = () => {
    globalCount++
    console.log(`globalCount: ${globalCount}`)
    if (globalCount >= GLOBAL_LIMIT) {
        console.log("Shutting down server.")
        process.exit(1)
    }
}

//Read User
exports.readUser = async (req, res) => {
    try {
        await connectDB()
        const user = await UserModel.findById(req.params.userId)
        
        if (!user) {
            // console.log("チェックポイント1")
            return res.status(400).json({ message: "ユーザーが存在しません" })
        }
        
        const fields = req.query.fields ? req.query.fields.split(',') : []
        let response = {}
        

        if (fields.length > 0) {
            fields.forEach(field => {
                if (user[field] !== undefined) {
                    response[field] = user[field]
                }
            })
        }
        else {
            response = user
        }

        // const userInfo = user.toObject()
        // const collect = user.collect
        console.log(response)
        return res.status(200).json({ message: "ユーザ情報読み取り成功", userData: response })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ message: "ユーザー情報を読み取れませんでした" })
    }
}

// Register User
exports.register = async(req, res) => {
    try{
        const clientIP = req.ip
        const rateLimitInfo = rateLimitMap.get(clientIP)
        const currentTime = new Date()


        if (rateLimitInfo && new Date() < rateLimitInfo.blockUntil) {
            incrementGlobalCount()

            return res.status(429).json({message: "BANされています"})
        }

        await connectDB();
        const codeDocument = await CodeModel.findOne({})
        const codeArray = codeDocument.code


        if (!codeArray.includes(req.body.code)) {
            incrementGlobalCount()

            if (rateLimitInfo) {
                rateLimitInfo.count++
                console.log(`banCount: ${rateLimitInfo.count}`)

                if (rateLimitInfo.count >= 7) {
                    rateLimitInfo.blockUntil = new Date(currentTime.getTime() + IP_BLOCK_TIME)
                    return res.status(400).json({ message: "一時的にBANされます" })
                }
            }
            else {
                rateLimitMap.set(clientIP, { count: 1, blockUntil: 0})
            }

            return res.status(400).json({ message: "現在は招待された方しか登録できません" })
        }
        
        const existingUsersCount = await UserModel.countDocuments({})
        if (existingUsersCount >= 20) {
            console.log("ユーザー数が上限に達しています")
            return res.status(400).json({ message: "ユーザー数が上限に達しています" })
        }
        
        // console.log(6 < req.body.password.length && req.body.password.length < 20)
        const regex = /^[a-zA-Z0-9-_]+$/
        const isPasswordValid = (6 < req.body.password.length && req.body.password.length < 20) && regex.test(req.body.password.length)

        if (!req.body.email.includes("@") || !isPasswordValid) {
            return res.status(400).json({ message: "入力が正しくありません" })
        }
        
        
        req.body.signature = `我が名は${req.body.name}、初めてこのAppを使う者！以後お見知り置きを！`
        req.body.avatar = "https://s2.loli.net/2023/10/09/I3wU4WaPunhJFgH.png"
        await UserModel.create(req.body)
        
        const index = codeDocument.code.indexOf(req.body.code);
        codeDocument.code.splice(index, 1)
        await codeDocument.save()

        return res.status(200).json({ message: "ユーザー登録成功" })
    }catch(err) {
        return res.status(500).json({ message: "ユーザー登録失敗だよ" })
    }
}

// Login User
const secret_key = "WhisperWave"

exports.login = async(req, res) => {
    try{
        const clientIP = req.ip
        const rateLimitInfo = rateLimitMap.get(clientIP)
        const currentTime = new Date()

        //IP CHECK
        if (rateLimitInfo && new Date() < rateLimitInfo.blockUntil) {
            incrementGlobalCount()

            return res.status(400).json({ message: "今はBANされています" });
        }

        await connectDB()
        const saveUserData = await UserModel.findOne({ email: req.body.email })
        
        if (saveUserData) {
            //アカウントが存在する
            const userId = saveUserData._id

            console.log('チェックポイント1')
            let banInfo = await BanInfoModel.findOne({ userId: userId })
            console.log('チェックポイント2')
            
            if (banInfo && new Date() < banInfo.blockUntil) {
                //BAN期間が終わっていない
                incrementGlobalCount()

                return res.status(429).json({message: "BANされています"})
            }


            if (req.body.password === saveUserData.password) {
                if (banInfo) {
                    await BanInfoModel.updateOne({ userId: userId }, { failCount: 0 });
                }

                const payload = {
                    email: req.body.email,
                }
                const token = jwt.sign(payload, secret_key, {expiresIn: "23h"})

                return res.status(200).json({ 
                    message: "ログイン成功",
                    token: token,
                    avatar: saveUserData.avatar,
                    userId: saveUserData._id,
                    userName: saveUserData.name
                });
            }
            else {
                //パスワードが間違っている
                if (banInfo) {
                    incrementGlobalCount()

                    //すでに何回かパスワードを間違えている
                    banInfo.failCount++
                    console.log(`banCount: ${banInfo.failCount}`)

                    if (banInfo.failCount >= 5) {
                        banInfo.blockUntil = new Date(currentTime.getTime() + BLOCK_TIME)
                        await banInfo.save()

                        return res.status(400).json({ message: "一定回数以上間違えたため、一時的にBANされます" })
                    }
                    await banInfo.save()
                }
                else {
                    //初めてパスワードを間違えた
                    await BanInfoModel.create({ userId: userId, failCount: 1 })
                }

                return res.status(400).json({ message: "ログイン失敗：アカウントかパスワードが間違っています" })
            }
        }
        else {
            //アカウントが存在しない
            incrementGlobalCount()

            //IPをBANする
            if (rateLimitInfo) {
                //すでに何回かアカウントを間違えている
                rateLimitInfo.count++
                console.log(`banCount: ${rateLimitInfo.count}`)

                if (rateLimitInfo.count >= 5) {
                    
                    rateLimitInfo.blockUntil = new Date(currentTime.getTime() + IP_BLOCK_TIME)
                    
                    return res.status(400).json({ message: "一定回数以上間違えたため、一時的にBANされます" })
                }
                
            }
            else {
                //初めてアカウントを間違えた
                rateLimitMap.set(clientIP, { count: 1, blockUntil: 0})
            }
            
            return res.status(400).json({ message: "ログイン失敗：アカウントかパスワードが間違っています" })
        }
        
    }catch(err) {
        return res.status(500).json({ message: "ログイン失敗: 通信に問題が発生しました" })
    }
}

// Logout User
exports.logout = (req, res) => {
    // Token blacklist logic here
    return res.status(200).json({ message: "ログアウト成功" })
}



//Follow
exports.follow = async (req, res) => {
    // console.log('チェックポイント1')
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        await connectDB()
        const {yourId, action} = req.params

        console.log(action)
        console.log(req.body.myId)
        console.log(yourId)

        const userFollow = await UserModel.findById(req.body.myId).session(session)
        const userBeFollowed = await UserModel.findById(yourId).session(session)

        if (!userFollow || !userBeFollowed) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({ message: "ユーザーが存在しません"})
        }



        if (action === 'follow') {

            await UserModel.updateOne(
                { _id: userFollow._id },
                { $addToSet: { follow: userBeFollowed._id } }
            ).session(session)

            await UserModel.updateOne(
                { _id: userBeFollowed._id },
                { $addToSet: { follower: userFollow._id } }
            ).session(session)

            await session.commitTransaction()
            session.endSession()

            return res.status(200).json({ message: "フォローしました" })
        }
        else if (action === 'unFollow') {

            await UserModel.updateOne(
                { _id: userFollow._id },
                { $pull: { follow: userBeFollowed._id } }
            ).session(session)
    
            await UserModel.updateOne(
                { _id: userBeFollowed._id },
                { $pull: { follower: userFollow._id } }
            ).session(session)
    
            await session.commitTransaction()
            session.endSession()
    
            return res.status(200).json({ message: "フォローしました" })
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "問題発生、フォローできませんでした" })
    }
}
