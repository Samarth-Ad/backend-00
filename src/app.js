import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express() ;

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    // Allows cookies to be sent across domains
    credentials : true,
}))

app.use(express.json({
    limit:"16kb"
}))

// Parses data from HTML forms
app.use(express.urlencoded({
    // extended: true allows nested objects
    extended : true,
    limit: "16kb"
}))

// Serves files directly from the public folder
app.use(express.static("public"))


// Reads cookies from incoming requests
// Allows you to set cookies in responses
app.use(cookieParser())

export {app} ;