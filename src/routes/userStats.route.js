import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { authorizedRoles } from "../middleware/auth.middleware.js";
import { userStats } from "../controllers/userStats.controller.js";

const router = Router();

router.route('/stats/users').get(verifyJWT,authorizedRoles('ADMIN'),userStats);

export default router