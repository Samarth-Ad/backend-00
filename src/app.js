import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    // Allows cookies to be sent across domains
    credentials: true,
}))

app.use(express.json({
    limit: "16kb"
}))

// Parses data from HTML forms
app.use(express.urlencoded({
    // extended: true allows nested objects
    extended: true,
    limit: "16kb"
}))

// Serves files directly from the public folder
app.use(express.static("public"))


// Reads cookies from incoming requests
// Allows you to set cookies in responses
app.use(cookieParser())


//routes import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.route.js"

//routes declaration
// instead of providing paths/routes in direct methods such as app.get(), app.post() etc, we'll use middleware(app.use()) since we are segregating the routes from now on 

// app.use("/users",userRouter) --> this is good but not standard practice 
app.use("/api/v1/users",userRouter)
// http://localhost:8000/api/v1/users/register (since we have defined only register method in users route)

app.use("/api/v1/videos",videoRouter)

export { app };