import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async function (userId) {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        console.log(user.refreshToken)
        await user.save({ validateBeforeSave: false })
        console.log(user)

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(
            500,
            error.message || "Something went wrong while generating refresh and access token"
        )
    }
}

const registerUser = asyncHandler(async (req, res) => {

    //step 1 : get user details from frontend (for this case we'll use postman since we don't have frontend ready with us) 

    //step 2 : validation of the data
    //         Checking for cases like "does user with this email/username already exists or not "


    //step 3 : Check id images have been uploaded to cloudinary or not
    //         Especially we'll check for avatar field, since it's required 


    //step 4 : Create user object - create entry in DB

    //step 5 : remove password and refresh token from the response

    //step 6 : check for user creation

    //step 7 : return response


    // if the data is coming from FORMs and in JSON format, (we'll deal with data coming from URL later)

    const { fullname, email, username, password } = req.body
    console.log("email : ", email)
    // console.log("password : ",password)

    // if (fullname === ""){
    //     throw ApiError(
    //         statusCode = 400,
    //         message = "Full Name is empty"
    //     )
    // }

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(
            400,
            "All fields are required to be filled",

        )
    }

    const userExisted = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (userExisted) {
        throw new ApiError(
            409,
            "User with email or username Already exists!"
        )
    }

    // File handling
    console.log(req.files)
    // avatar: [
    // {
    //   fieldname: 'avatar',
    //   originalname: 'test_profile.png',
    //   encoding: '7bit',
    //   mimetype: 'image/png',
    //   destination: './public/temp',
    //   filename: 'test_profile.png',
    //   path: 'public\\temp\\test_profile.png',
    //   size: 1304568
    // }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(
            400,
            "Avatar File is required"
        );
    }

    // Upload images in cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath,"avatar");
    const coverImage = await uploadOnCloudinary(coverImageLocalPath,"coverimage");

    if (!avatar) {
        throw new ApiError(
            400,
            "Avatar File is required"
        );
    };

    const user = await User.create({
        username: username.toLowerCase(),
        avatar: avatar.url,
        email: email,
        fullname: fullname,
        coverImage: coverImage?.url || "",
        password: password
    });
    // console.log(User.findById(user._id))

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!userCreated) {
        throw new ApiError(
            500,
            "Something went wrong during registration of user"
        )
    }
    // console.log(user)

    // Final response
    return res.status(201).json(
        new ApiResponse(
            201,
            user,
            "User Successfully registered"
        )
    )

})


const loginUser = asyncHandler(async (req, res) => {
    // 0) Pehle Request se data lo
    // 1) Refresh token generate karwana padega, unique to user
    // 2) Then access token, unique to user

    const { email, username, password } = req.body;

    if (!email && !username) {
        throw new ApiError(
            400,
            "Username or password not found",
        )
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        console.log("User not found");
        throw new ApiError(
            404,
            "User not found or doesn't exist"
        )
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(
            401,
            "Password is incorrect"
        )
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // For cookies
    const options = {
        //Can be handled through server only 
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    refreshToken: refreshToken,
                },
                "User logged in successfully"
            )
        )

})


const logOutUser = asyncHandler(async function (req, res) {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        },
    )
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        )
})

const refreshAccessToken = asyncHandler(async function (req, res) {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    // used "req.body.refreshToken" if the request is from mobile

    if (!incomingRefreshToken) {
        throw new ApiError(
            401,
            "Unauthorized Request"
        )
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(
                401,
                "Invalid refresh token"
            )
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(
                401,
                "Refresh token expired or used"
            )
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken: accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access Token refreshed"
                )
            )
    } catch (error) {
        throw ApiError(
            401,
            error.message || "Invalid Refresh token"
        )
    }

})


const changeCurrentPassword = asyncHandler(async function (req, res) {
    const { oldPassword, newPassword } = req.body

    // this function runs when the user is already logged in, mean's we have user in req's body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(
            401,
            "Password is incorrect"
        )
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(
        new ApiResponse(
            200,
            "Password reset successful"
        )
    )
})

const getCurrentUser = asyncHandler(async function (req, res) {
    // when end point for this function is invoked then it means that user is already logged-in , and in our auth.middleware.js we've stored the user as it is in request

    return res
        .status(200)
        .json(200, req.user, "current user fetched successfully")

})

const updateAccountDetails = asyncHandler(async function (req, res) {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(
            400,
            "All fields are required"
        )
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Details changed successfully",
            )
        )


})

const updateUserAvatar = asyncHandler(async function (req, res) {

    const user = await User.findById(req.user._id).select("-password")
    if (!user) {
        throw new ApiError(
            404,
            "Couldn't find user"
        )
    }

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(
            400,
            "Couldn't find avatar file"
        )
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath,"avatar")
    if (!avatar) {
        throw new ApiError(
            400,
            "Error while uploading avatar on cloudinary"
        )
    }

    const oldAvatar = user.avatar
    user.avatar = avatar.url

    await user.save();

    if (oldAvatar) {
        const isDeleted = await deleteFromCloudinary(oldAvatar,"image")
        console.log(isDeleted)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar updated successfully"
            )
        )
})


const updateCoverImage = asyncHandler(async function (req, res) {

    const user = await User.findById(req.user._id).select("-password")
    if (!user) {
        throw new ApiError(
            404,
            "Couldn't find user"
        )
    }

    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(
            400,
            "Couldn't find cover-image file"
        )
    }


    const coverImage = await uploadOnCloudinary(coverImageLocalPath,"coverimage")
    if (!coverImage) {
        throw new ApiError(
            400,
            "Error while uploading cover-image on cloudinary"
        )
    }

    const oldCoverImage = user.coverImage
    user.coverImage = coverImage.url

    await user.save();

    if (oldCoverImage) {
        const isDeleted = await deleteFromCloudinary(oldCoverImage,"image")
        console.log(isDeleted)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover-Image updated successfully"
            )
        )
})

const getUserChannelProfile = asyncHandler(async function (req, res) {
    const { username } = req.params

    if (!username) {
        throw new ApiError(
            400,
            "Couldn't find username"
        )
    }

    // User.find({username})
    const channel = User.aggregate([
        // Aggregation pipelines
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        // to count subscribers
        {
            $lookup: {
                from: "subscriptions", // from subscription model
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // to count how many channel the current profile has subscribed to
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        // These new fields get added to the user's object/document
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                subscribedTo: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                email: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(
            404,
            "Channel doesn't exists"
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "User Channel fetched successfully"
            )
        )

})


const getUserWatchHistory = asyncHandler(async function (req, res) {
    const user = await User.aggregate([
        {
            $match: {
                // _id: req.user?._id --> This won't work because mongoose doesn't handle aggregation pipelines with it's own magic
                _id: new mongoose.Types.ObjectId(req.user?._id)
            },

        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                //nested pipeline to get the info/data on the owner of video present in playlist 
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1
                                    },
                                },
                            ]
                        },
                    },
                    // This pipeline just reformats the data, since till now we've been receiving an array and we only need that array's 1st object 
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Fetched user's watch history successfully",
        )
    )
})


export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}