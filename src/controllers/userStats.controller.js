import { Course } from "../model/course.model.js";
import { User } from "../model/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const userStats = asyncHandler(async(req, res) => {
	const { id } = req.user

	const user = await User.findById(id)
	if(!user){
		throw new apiError(404, "Unathorized user, please login")
	}

	const allUserCount = await User.countDocuments()
	
	const subscribedCount = await User.countDocuments({ "subscription.id": { $exists: true }, "subscription.status": "active" });

	const stats = {
		allUserCount,
		subscribedCount
	}	

	return res
		.status(200)
		.json(new apiResponse(
			200,
			stats,
			"stats fetched successfully"
		))
})