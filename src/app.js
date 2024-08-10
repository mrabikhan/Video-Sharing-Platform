import mongoose from "mongoose";
import express, { json } from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";


const app = express();

//use keywords is used when we are working with a middleware.
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//limit property defines the size of maximum data sent to the server.
app.use(express.json({limit:"500kb"}));

//url encoded is used to define the pattern of the url.
//extended property is used to make nested objects.
app.use(express.urlencoded({extended:true, limit:"500kb"}));

//This statement is for the public assets like favicon etc.
app.use(express.static("public"));
app.use(cookieParser())

app.use(express.json({limit: "500kb"}))


//Routing:
//Import Routers: 
import userRouter from "./routes/user.router.js";
import videoRouter from "./routes/video.router.js";
import subscribeRouter from "./routes/subscription.router.js";
import commentRouter from "./routes/comment.router.js";
import likeRouter from "./routes/like.router.js";
import tweetRouter from "./routes/tweet.router.js";
import dashboardRouter from "./routes/dashboard.router.js";

//Router Declaration:
app.use("/api/v1/users", userRouter); //The control is passes to user.router file
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscription", subscribeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/dashboard", dashboardRouter);
//export {app};
export default app;

