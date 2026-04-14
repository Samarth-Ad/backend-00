import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, updateVideoDetails, uploadVideo, togglePublishStatus } from "../controllers/video.controller.js";


const router = Router()

router.route("/upload-video").post(
    verifyJWT,
    // type of upload function that'll handle the upload in temp folder 
    upload.fields([
        //Avatar
        {
            name: "videoFile",
            maxCount: 1,
        },
        //Cover image
        {
            name: "thumbnailFile",
            maxCount: 1,
        },
    ]),
    uploadVideo
)

router.route("/delete-video").delete(
    verifyJWT,
    deleteVideo
)

router.route("/").get(getAllVideos)

router.route("/:videoId").get(getVideoById)

router.route("/:videoId").patch(
    verifyJWT,
    upload.fields([
        {
            name:"thumbnailFile",
            maxCount:1
        }
    ]),
    updateVideoDetails
)

router.route("/toggle/publish/:videoId").patch(
    verifyJWT,
    togglePublishStatus
);


export default router;