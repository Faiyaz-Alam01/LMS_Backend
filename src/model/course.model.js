import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema({
	title: {
		type: String,
		required: true,
		unique: true
	},
	createdBy: {
		type: String,
		required: true,
		trim: true,
	},
	category: {
		type: String,
		required: true,
		trim: true,
		uppercase: true,
	},
	description: {
		type: String,
		required: true,
		trim: true,
	},
	avatar: {
		type: String,
		required: true
	},
	video:{
		type: String,
	},
	numberOfLectures:{
		type: Number,
		default: 0
	},
	lectures: [
		{
			title: String,
			description: String,
			videoUrl: {
				type: String,
				required: true,
			}
		}
	]
}, {timestamps: true})

export const Course = mongoose.model("Course", courseSchema)