import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadVideo } from "../controllers/video.controller.js";


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


export default router;