require('dotenv').config()
const express = require("express")
const app = express()
const cors = require("cors")
app.use(cors());
// app.use((req, res, next) => {
//     console.log('Request Headers:', req.headers)
//     console.log('Request URL:', req.url)
//     console.log('Request Method:', req.method)
//     res.on('finish', () => {
//         console.log('Response Headers:', res.getHeaders())
//     })
//     res.setHeader('Access-Control-Allow-Private-Network', 'true');
//     next()
// })

app.use(express.urlencoded({ extended: true}))
app.use(express.json());
const itemRouter = require("./routes/itemRoutes")
const userRouter = require("./routes/userRoutes")

app.use("/api", itemRouter)
app.use("/api/user", userRouter)


// Connecting to port
const port = 5050 || process.env.PORT

app.listen(port, () => {
    console.log(`Listening on ${port}`)
});
