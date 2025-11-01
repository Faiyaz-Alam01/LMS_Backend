import {asyncHandler} from '../utils/asyncHandler.js'
import {apiError} from '../utils/apiError.js'
import {apiResponse} from '../utils/apiResponse.js'
import { User } from '../model/user.model.js'
import {uploadOnCloudinary} from '../config/cloudinary.js'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import bcrypt from 'bcryptjs'

const generateAccessAndRefreshToken = async(id) => {
	try {
		const user = await User.findById(id);
		const accessToken = user.generateAccessToken();
		const refreshToken = user.generateRefreshToken();

		user.refreshToken = refreshToken

		await user.save({validateBeforeSave: false});

		return {accessToken, refreshToken}

	} catch (error) {
		throw new apiError (500, "Something went wrong while generating referesh and access token")
	}

}

export const registerUser= asyncHandler(async(req,res) => {

	const {fullName, email, password} = (req.body);	

	if(
		[fullName,email, password].some((fields) => 
		fields?.trim() === "")
	){
		throw new apiError(400,"All fields are required");
	}

	//user existence
	const existedUser = await User.findOne({email})

	if(existedUser){
		throw new apiError(400, "Email  already exists");
	}

	let avatar;
	if(req.file){
		const avatarFilePath = req.file.path;
		const result = await uploadOnCloudinary(avatarFilePath);
		// console.log("result", result);
		
		avatar = result?.secure_url || ""
	}
	
	const user = await User.create({
		fullName,
		email,
		password,
		avatar
	})

	const createdUser = await User.findById(user._id).select("-password -refreshToken")

	if (!createdUser) {
		throw new apiError (500, "Something went wrong while registering the user ")
	}

	return res
	.status(200)
	.json(new apiResponse(
		200,
		createdUser,
		"User registered successfully",
	))

}) 

export const userlogin = asyncHandler(async(req,res) => {	
	const {email, password} = req.body

	// if([email, password].some((field) => field.trim() === "")){
	// 	throw new apiError(400, "All fileds are required")
	// }

	if(!email || !password){
		throw new apiError(400, "All fileds are required")
	}

	const user = await User.findOne({email})

	if(!user){
		throw new apiError(401, "User does not found")
	}

	const isPasswordValid = await user.isPasswordCorrect(password)

	if(!isPasswordValid){
		throw new apiError(409, "Invalid credentials")
	}

	const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

	const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

	const options = {
		httpOnly : true,
		secure: true
	}

	return res
	.status(201)
	.cookie("accessToken", accessToken, options)
	.cookie("refreshToken", refreshToken, options)
	.json(new apiResponse(
		201,
		{
			user: loggedInUser, accessToken, refreshToken
		},
			"User logged In successfully"
	))

})
	
export const logoutUser = asyncHandler(async(req, res) => {
	await User.findByIdAndUpdate(
		req.user._id,
		{
			$unset: {
				refreshToken: 1  //this removes the field from document
			}
		},
		{
			new: true
		}

	)

	const options = {
		httpOnly: true,
		secure: true
	}

	return res
	.status(200)
	.clearCookie("accessToken", options)
	.clearCookie("refreshToken", options)
	.json(new apiResponse(
		200,
		{},
		"Logout successfully"
	))
})

export const getUser = asyncHandler(async(req, res) => {
	const user = await User.findById(req.user._id);

	if(!user){
		throw new apiError(401, "user not found")
	}

	const getUser = await User.findById(user._id).select("-password -refreshToken")

	return res
	.status(201)
	.json(new apiResponse(
		201,
		getUser,
		"fetched data successfully"
	))


})

export const updateProfile = asyncHandler(async(req, res) => {
	const { fullName } = req.body
	const {id} = req.params

	const avatarLocalPath = req.file?.path
	const user = await User.findById(id)
	
	if(!user){
		throw new apiError(400, "Unathorized user");
	}
	
	if(fullName){
		const existName = await User.findOne({fullName})
		if(existName){
			throw new apiError(400, "same name exits, try different name");
		}
		user.fullName = fullName
	}


	
	if(avatarLocalPath){
		const avatar = await uploadOnCloudinary(avatarLocalPath);
		if(!avatar?.secure_url){
			throw new apiError(500,"error while uploading avatar on cloudinary")
		}
		user.avatar = avatar?.secure_url;
	}

	await user.save();

	// const updatedUser = await User.findByIdAndUpdate(
	// 	req.user._id,
	// 	{
	// 		fullName,
	// 		avatar:avatar.secure_url,
	// 	},
	// 	{new: true}
	// )

	return res
	.status(201)
	.json(new apiResponse(
		200,
		user,
		"Profile updated successfully"
	))
})

export const changePassword = asyncHandler(async(req, res) => {
	const {new_password, old_password, confirm_password} = req.body	

	if([new_password , old_password , confirm_password].some(field=>field.trim()==="")){
		throw new apiError("All fields are required")
	}

	if(new_password !== confirm_password){
		throw new apiError(402, "new and confirm password are different")
	}

	const user = await User.findById(req.user._id)
	if(!user){
		throw new apiError(402, "User not found")
	}

	const isValid = await user.isPasswordCorrect(old_password);
	if(!isValid){
		throw new apiError(401,"Old Password is wrong")
	}

	user.password = new_password;
	await user.save();

	return res
	.status(201)
	.json(new apiResponse(
		201,
		{},
		"Password successfully changed"
	))

})

export const forgotPassword = asyncHandler(async(req, res) => {
	const {email} = req.body;

	if(!email ){
		throw new apiError(404,"email is required!")
	}

	const user = await User.findOne({email})
	if(!user){
		throw new apiError(401, "user does not found")
	}

	const token = jwt.sign({email}, process.env.JWT_SECRET_KEY,{
		expiresIn: "1hr"
	});

	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.MY_GMAIL,
			pass: process.env.MY_PASSWORD, //app password create using gmail
		},
	})

	const receiver = {
		from: "faiyaz0399@gmail.com", // Or process.env.MY_GMAIL
		to: email,
		subject: "Password Reset Request",
		text: `Click the following link to reset your password: ${process.env.CLIENT_URL}/reset-password/${token}`,
		html: `
			<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<h2>Password Reset Request</h2>
			<p>Hello,</p>
			<p>We received a request to reset your password. Click the button below to set a new password:</p>
			<p>
				<a href="${process.env.CLIENT_URL}/reset-password/${token}" 
				style="display:inline-block; padding:10px 20px; background:#007BFF; color:#fff; text-decoration:none; border-radius:5px;">
				Reset Password
				</a>
			</p>
			<p>If the button doesn’t work, copy and paste this link into your browser:</p>
			<p><a href="${process.env.CLIENT_URL}/reset-password/${token}">${process.env.CLIENT_URL}/reset-password/${token}</a></p>
			<p>If you didn’t request a password reset, you can safely ignore this email.</p>
			<hr/>
			<p style="font-size:12px; color:#666;">This link will expire in 15 minutes for security reasons.</p>
			</div>
		`
	};


	await transporter.sendMail(receiver)
	
	return res
	.status(200)
	.json(new apiResponse(
		200,
		{},
		"Password reset link send successfully on your gmail account"
	))

})

export const resetPasaword = asyncHandler( async(req, res) => {
	const {token} = req.params;
	const {password, confirPassword} = req.body;

	if(!password){
		throw new apiError(404, "Password is required")
	}

	if(confirPassword && password !==confirPassword){
		throw new apiError(400, "Password and confirm password do not match");
	}

	if (!/^[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(password)) {
        throw new apiError(400, "Password must be 6–16 characters and include letters, numbers, !@#$%^&*");
    }

	const decode = jwt.verify(token,process.env.JWT_SECRET_KEY)
	const user = await User.findOne({email: decode.email});

	user.password = password;
	await user.save()

	return res
	.status(200)
	.json(new apiResponse(
		201,
		{},
		"Password reset successfully"
	))
	
 })