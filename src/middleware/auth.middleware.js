import { User } from "../model/user.model.js";
import { apiError } from "../utils/apiError.js"

export const authorizedRoles = (...roles) => async(req, res, next) => {

	const currentUserRole = req.user.role
	if (!roles.includes(currentUserRole)) {
		return next(
			new apiError(500, "You do not have permission to access this route")
		)
	};
	next();
}

export const authorizedSubscriber = async (req, res, next) => {
	const user = await User.findById(req.user.id);
	
	if (user.role !== 'ADMIN' && user.subscription.status !=='active') {
		return next (
			new apiError(403,'Please subscribe to access this route')
		)
	}

	next();
}