import mongoose, { mongo } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { pipeline } from "stream"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(
            400,
            "Invalid Video ID"
        )
    }

    const pipeline = [
        {
            $match: {
                video: new mongoose.Schema.Types.ObjectId(videoId)
            }
        },
        {
            $sort: {
                createdAt: -1 
            }
        },
        {
            $lookup: {
                from:"users",
                localField: "owner",
                foreignField: "_id",
                as : "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
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
        }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const comments = await Comment.aggregatePaginate(
        Comment.aggregate(pipeline),
        options
    )

    return res.status(200).json(
        new ApiResponse(
            200,
            comments,
            "Comments fetched successfully"
        )
    )



})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const {videoId} = req.params
    const {content} = req.body
    const userId = req.user?._id

    if(!userId){
        throw new ApiError(
            404,
            "Couldn't find user"
        )
    }

    if(!content || content.trim()===""){
        throw new ApiError(
            400,
            "No content found in comments"
        )
    }

    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: userId
    })

    if(!comment){
        throw new ApiError(
            500,
            "Couldn't create comment"
        )
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment added successfully"
        )
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const commentId = req.params
    const newContent = req.body

    const userId = req.user?._id 
    if(!userId){
        throw new ApiError(
            404,
            "Couldn't find user"
        )
    }

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(
            400,
            "Invalid comment ID"
        )
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(
            404,
            "Couldn't find comment"
        )
    }

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(
            403, 
            "Unauthorized to update this comment"
        );
    }

    if(!content || content.trim()===""){
        throw new ApiError(
            400,
            "No content found in comments"
        )
    }

    comment.content = content
    await comment.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment updated successfully"
        )
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}