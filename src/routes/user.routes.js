import { Router } from "express";
import { 
    loginUser, 
    logOutUser, 
    refreshAccessToken, 
    registerUser, 
    changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getUserWatchHistory, 
    updateAccountDetails, 
    updateCoverImage, 
    updateUserAvatar 
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

// refer to this chat with claude.ai : https://claude.ai/share/91b6e4fd-0407-48ef-b9e2-8c06e89808b0
router.route("/register").post(
    // MiddleWare -1
    upload.fields([
        //Avatar
        {
            name: "avatar",
            maxCount: 1,
        },
        //Cover image
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    // MiddleWare - 2
    registerUser
)

router.route("/login").post(
    loginUser
)


// secured routes 
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)


router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getUserWatchHistory)

export default router;