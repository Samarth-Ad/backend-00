import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    const userId = req.user?._id;

    if (isValidObjectId(channelId)) {
        throw ApiError(
            400,
            "Invalid Channel-Id"
        )
    }

    if (channelId === userId.toString()) {
        throw new ApiError(
            400,
            "You cannot subscribe to yourself"
        );
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    // unsubscribe
    if (existingSubscription) {
        deleteSubscription = await Subscription.findOneAndDelete(existingSubscription._id)

        if (!deleteSubscription) {
            throw new ApiError(
                500,
                `Couldn't unsubscribe to channel`
            )
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { subscribed: false },
                "Unsubscribed successfully"
            )
        );
    }

    // subscribe
    newSubscription = await Subscription.create({
        subscriber: userId,
        channel: channelId
    });

    if (!newSubscription) {
        throw new ApiError(
            500,
            `Couldn't subscribe to channel`
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { subscribed: true },
            "subscribed successfully"
        )
    );


})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(
            400,
            "Invalid Channel Id"
        )
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Schema.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscriber: {$first:"$subscriber"}
            }
        }
    ])

    if(!subscribers){
        throw new ApiError(
            500,
            "Couldn't fetch the subscribers"
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully"
        )
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params


    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(
            400,
            "Invalid Subscriber Id"
        )
    }

    const channels  = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Schema.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscriber: {$first:"$channel"}
            }
        }
    ])

    if(!channels){
        throw new ApiError(
            500,
            "Couldn't fetch the Channels"
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            channels,
            "Channels fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}