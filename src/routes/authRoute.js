import { Router } from "express";
import { changePassword, forgotPassword, getUser, logoutUser, registerUser, resetPasaword, updateProfile, userlogin } from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { upload } from "../middleware/multer.middleware.js";
const router = Router();

router.route('/register').post(upload.single("avatar"),registerUser)
router.route('/login').post(userlogin)
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/get-user').get(verifyJWT, getUser)
router.route('/update-profile/:id').post(upload.single("avatar"),verifyJWT, updateProfile)
router.route('/change-password').post(verifyJWT, changePassword)
router.route('/forget-password').post(forgotPassword)
router.route('/reset-password/:token').post(resetPasaword)


export default router