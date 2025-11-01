import { Router } from "express";
import { userContact } from "../controllers/contact.controller.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

router.route('/user').post(verifyJWT,userContact)

export default router