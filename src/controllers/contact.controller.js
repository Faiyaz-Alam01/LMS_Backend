import { Contact } from "../model/contact.model.js";
import { User } from "../model/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import nodemailer from "nodemailer";

export const userContact = asyncHandler(async(req, res) =>{
	const { name, email, message } = req.body
	const {id}= req.user;

	const user = await User.findById(id);

	if(!user){
		throw new apiError(500, "Unathorized user")
	}

	if([name, email,message].some((field) => field.trim() === "")){
		throw new apiError(400, "All fields are required")
	}

	const contact = await Contact.create({
		name,
		email,
		message
	})

	//send email
	const transporter = nodemailer.createTransport({
		service:"gmail",
		auth: {
			user: process.env.MY_GMAIL,
			pass: process.env.MY_PASSWORD,
		},
	});

	await transporter.sendMail({
		from: email,
		to:process.env.MY_GMAIL,
		subject:`New Contact Form Submission from ${name}`,
		html:`
			<h2>New Message Received</h2>
			<p><b>Name:</b> ${name}</p>
			<p><b>Email:</b> ${email}</p>
       		<p><b>Message:</b> ${message}</p>
        	<p><i>${contact.createdAt}</i></p>
		`,	
	})

	return res
		.status(200)
		.json(new apiResponse(
			200,
			"Message saved & sent successfully",
			contact

		))
})