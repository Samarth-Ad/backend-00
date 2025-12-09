import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
        },
        coverImage: {
            type: String, //cloudinary url 
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String, // we store encrypted passwords
            required: [true, "Password is require"]
        },
        refreshTokens: {
            type: String,
        }

    },
    { timestamps: true }
);


// To encrypt passwords we'll use middleware/hooks that comes pre-defined in mongoose.schema class
// and since we're dealing with database (which is located in another continent)
userSchema.pre("save", async function (next) { // Don't use arrow function, cuz it won't have the context with ".this" keyword

    // this.password = bcrypt.hash(this.password,10)
    // next()
    // // with only 2 lines above we have created a problem
    // // Every time any parameter is change of the schema's object the password will get hashed again

    if (this.isModified("password")) {
        this.password = bcrypt.hash(this.password, 10)
        next()
    }
    else {
        next()
    }
})


userSchema.methods.isPasswordCorrect = async function (password) {
    // returns boolean
    return await bcrypt.compare(password, this.password);
}

// access-token won't be stored in database
// but refresh-token will be
// both are JWT tokens

// access-token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        // payload 
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

// refresh-token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        // payload 
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}



export const User = mongoose.model("User", userSchema);
