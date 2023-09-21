const express = require("express"); 
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
const itemRouter = require("./routes/itemRoutes");
const userRouter = require("./routes/userRoutes");

app.use("/", itemRouter)
app.use("/user", userRouter)


// Connecting to port
const port = process.env.PORT || 5050

app.listen(port, () => {
    console.log(`Listening on ${port}`);
});
