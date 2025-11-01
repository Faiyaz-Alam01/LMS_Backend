import { uploadOnCloudinary } from "../config/cloudinary.js";
import { Course } from "../model/course.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createCourse = asyncHandler(async(req, res) => {

	const { title, createdBy, category, description} = req.body
	
	const avatarLocalPath = req.file?.path

	if([title,createdBy,category,description].some(field=> !field || field.trim() === "")){
		throw new apiError(400, "All fields are required")
	}

	if(!avatarLocalPath){
		throw new apiError(400,"Course thumbnail (avatar) is required");
	}

	const avatar = await uploadOnCloudinary(avatarLocalPath);	

	if(!avatar.secure_url){
		throw new apiError(500, "Error while uploading avatar file on cloudinary")
	}

	const course = await Course.create({
		title,
		createdBy,
		category,
		description,
		avatar:avatar.secure_url
	})

	if(!course){
		throw new apiError(500, "Course could not created, Please try again" )
	}

	return res
	.status(200)
	.json(new apiResponse(
		200,
		{course},
		"Course created successfully "
	))

})

export const getAllCourses = asyncHandler(async(req, res) => {
	const course = await Course.find();

	if(!course || course.length === 0){
		throw new apiError(404, "No courses found")
	}

	return res
	.status(200)
	.json(new apiResponse(
		200,
		course,
		"Fetched course successfully"
	))
})

export const updateCourse = asyncHandler(async(req, res) => {
	const {id} = req.params
	// console.log(id);
	// console.log(req.body);
	
	
	// const { title, createdBy, category, description} = req.body

	const course = await Course.findByIdAndUpdate(
		id,
		{
			$set : req.body  // jo bhi data milega req.body se use update kar do
		},
		{
			new: true
		}
	);

	if(!course){
		throw new apiError(500, "Course not found")
	}

	return res
		.status(200)
		.json(new apiResponse(
			200,
			course,
			"Course updated successfully",
		))
})

export const removeCourse = asyncHandler(async(req, res) => {
	const {id} = req.params

	const course = await Course.findByIdAndDelete(id);
	if (!course) {
		throw new apiError(404, "Course not found");
	}

	return res
		.status(200)
		.json(new apiResponse(
			200,
			"Course deleted successfully"
		));

})

export const addLectureToCourseById = asyncHandler(async(req, res)=> {
	const { id } = req.params 
	const {title, description} = req.body
	
	if(!title || !description){
		throw new apiError(400,"title and Description are required")
	}

	const course = await Course.findById(id);	

	if(!course){
		throw new apiError(400, "Invalid course id  or course not found")
	}

	const videoLocalPath= req.file?.path
	
	if(!videoLocalPath){
		throw new apiError(400, "video path is  required")
	}

	const video = await uploadOnCloudinary(videoLocalPath)	

	if(!video){
		throw new apiError(500, "Error while uploading video file on cloudinary")
	}
	
	course.lectures.push({
		title,
		description,
		videoUrl: video.secure_url
	})
	course.numberOfLectures = course.lectures.length;
	
	await course.save();

	return res
		.status(200)
		.json(new apiResponse(
			200,
			course,
			"Lecture added successfully to the course",
		))

})

export const deleteLecture = asyncHandler(async(req,res)=> {
	// console.log(req.params);
	const { courseId, lectureId} = req.params
	
	const course = await Course.findByIdAndUpdate(
		courseId,
		{ $pull: {lectures : {_id : lectureId}}},
		{new : true}
	)
	
	if(!course){
		throw new apiError(404, "Course not found ")
	}
	

	return res
		.status(200)
		.json(new apiResponse(
			200,
			"Lecture deleted successfull"
		))
})

export const getCourseLectures = asyncHandler(async(req,res) => {	
	const {id} = req.params;	
	
	const course = await Course.findById(id);
	
	if(!course){
		throw new apiError(500, "Course not found")
	}
	
	return res
		.status(200)
		.json(new apiResponse(
			200,
			{lectures:course.lectures},
			"fetched lectures successfully!",
		))
})