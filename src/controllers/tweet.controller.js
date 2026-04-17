import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const userId  = req.user?._id;
    if (!userId) {
        throw new ApiError(
            404,
            "User not found"
        )
    }

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(
            404,
            "Invalid user id"
        )
    }

    const { content } = req.body
    if (!content || content.trim() === "") {
        throw new ApiError(
            400,
            "Tweet content is required"
        );
    }

    const tweet = await Tweet.create({
        owner: userId,
        content: content
    })

    if (!tweet) {
        throw new ApiError(
            500,
            "Couldn't create the tweet"
        )
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            tweet,
            "Tweet created successfully"
        )
    );
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    const { limit = 10, page = 1 } = req.query;

    if (!userId) {
        throw new ApiError(
            404,
            "User not found"
        )
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const pipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ]

    const fetchUserTweets = Tweet.aggregate(pipeline)

    const options = {
        limit: parseInt(limit),
        page: parseInt(page)
    }

    const paginatedUserTweets = await Tweet.aggregatePaginate(fetchUserTweets,options)

    if(!paginatedUserTweets){
        throw new ApiError(
            500,
            "Couldn't fetch tweets.Try again."
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            paginatedUserTweets,
            "Successfully fetched user Tweets"
        )
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { newContent } = req.body;
    const userId = req.user?._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to update this tweet");
    }

    if (!newContent || newContent.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    const updateTweet = await Tweet.findOneAndUpdate(
        {
            _id:tweetId,
            owner:userId
        },
        {
            $set: {
                content: newContent.trim()
            }
        },
        {
            new: true 
        }
    )
    if (!updateTweet) {
        throw new ApiError(
            404,
            "Couldn't update the tweet"
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            updateTweet,
            "Tweet updated successfully"
        )
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to delete this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(
        new ApiResponse(200, null, "Tweet deleted successfully")
    );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}