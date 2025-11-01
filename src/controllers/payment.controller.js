import crypto from 'crypto';
import { razorpay } from "../index.js";
import { Payment } from "../model/payment.model.js";
import { User } from "../model/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getRazorPayApiKey = asyncHandler(async(req, res) => {
	return res
		.status(200)
		.json(new apiResponse(
			200,
			{key : process.env.RAZORPAY_KEY_ID},
			"Razorpay API Key",
		))
})

export const buySubscription = asyncHandler(async(req, res) => {
	const{id} = req.user;

	const user = await User.findById(id);	

	if(!user){
		throw new apiError(401,"Unathorized User, Please login")
	}

	if(user.role === "ADMIN"){
		throw new apiError(401,"Admin can't purchage a subscription")
	}

	//Creating a subscription using razorpay that we imortent for server
	const subscription = await razorpay.subscriptions.create({
		plan_id: process.env.RAZORPAY_PLAN_ID,
		customer_notify: 1,
		total_count: 12  //12 month subscription, user would not cancel.
	});
	// console.log("subscription", subscription);
	

	// Adding ID and Status to the user account 
	user.subscription.id = subscription.id;
	user.subscription.status = subscription.status;

	await user.save(); //save	

	return res
		.status(200)
		.json({
			success: true,
			message: "Subscription successfully",
  			subscription_id: subscription.id
		})
})

export const verifySubscription = asyncHandler(async(req, res) => {
	const{id} = req.user;
	
	const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body

	const user = await User.findById(id);

	if(!user){
		throw new apiError(401,"Unathorized User, Please login")
	}

	
	const subscriptionID = user.subscription.id;

	//generate a signature using crypto
	const generatedSignature = crypto
		.createHmac("sha256", process.env.RAZORPAY_SECRET)
		.update(`${razorpay_payment_id}|${subscriptionID}`)
		.digest('hex');
	
	
	if(generatedSignature !== razorpay_signature) {
		throw new apiError(404, "Payment not verified, Please try again")
	}

	await Payment.create({
		razorpay_payment_id,
		razorpay_signature,
		razorpay_subscription_id
	})

	//Update the user subscription status to active  (This will be created before this)
	user.subscription.status = 'active'
	await user.save();

	return res
		.status(200)
		.json(new apiResponse(
			200,
			"Payment verified successfully"
		))

})

export const cancelSubscription = asyncHandler(async(req, res) => {
	const { id } = req.user;	

	const user = await User.findById(id)
	
	if(!user){
		throw new apiError(401, "Unauthorized User")
	}

	if(user.role === 'ADMIN'){
		throw new apiError(403,"ADmin can't cancel subscription")
	}

	const subscribeId = user.subscription.id;
		
	if(!subscribeId){
		throw new apiError(400, "No active subscription found");
	}

	// Cancel subscription from Razorpay
	try {
		const subscriptionDetails = await razorpay.subscriptions.fetch(subscribeId);

		if (subscriptionDetails.status === "completed") {
			throw new apiError("Subscription already completed, cancel not possible", 400);
		}

		if (subscriptionDetails.status !== "active") {
			throw new apiError(
				400,
				`Subscription cannot be cancelled in status: ${subscriptionDetails.status}`,
			);
		}

		// only call cancel if active
		const subscription = await razorpay.subscriptions.cancel(subscribeId)
		
		user.subscription.status= subscription.status

		await user.save();

		return res
			.status(200)
			.json(new apiResponse(
				200,
				{ subscription: user.subscription },
				"Subscription canceled successfully"
			))

		} catch (error) {
			console.log(error);
			throw new apiError(error?.error?.description )
		}
})

export const allPayments = asyncHandler(async(req, res) => {
	let {count, skip} = req.query;	
	
	//find all subscription from razorpay
	const allPayments = await razorpay.subscriptions.all({
		count: count ? count:10, // // If count is sent then use that else default to 10
		skip: skip ? skip : 0, // // If skip is sent then use that else default to 0
	})	
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

	const finalMonths = {
		January: 0,
		February: 0,
		March: 0,
		April: 0,
		May: 0,
		June: 0,
		July: 0,
		August: 0,
		September: 0,
		October: 0,
		November: 0,
		December: 0,
	};
	
	const monthlyWisePayments = allPayments.items.map((payment) => {
		// We are using payment.start_at which is in unix time, so we are converting it to Human readable format using Date()
		const monthsInNumber = new Date(payment.start_at * 1000);
		return monthNames[monthsInNumber.getMonth()];

	})

	monthlyWisePayments.map((month) => {
		Object.keys(finalMonths).forEach((objMonth) => {
			if (month === objMonth) {
				finalMonths[month] += 1;
			}
		});
	})

	const monthlySalesRecord = [];

	Object.keys(finalMonths).forEach((monthName) => {
		monthlySalesRecord.push(finalMonths[monthName]);
	});


	console.log(monthlySalesRecord);	
	
	return res
		.status(200)
		.json(new apiResponse(
			200,
			{
				allPayments,
				finalMonths,
				monthlySalesRecord,
			},
			'All payments fetched successfully',
		))
})