import express from "express"
import connectDB from "./config/mongoDb.js";
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from "dotenv"
import Razorpay from 'razorpay'

dotenv.config({
	path:"./.env"
})

const app = express ();
const PORT = process.env.PORT || 5001

//middleware
app.use(cors ({
	origin: process.env.FRONTEND_URL,
	credentials: true,
}))
app.use(express.json()); //<-- JSON body parse karega
app.use(cookieParser())
app.use(express.urlencoded({ extended: true })); // <-- form-data ke liye

//razorpay config
export const razorpay = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_SECRET
})

//route
import authRoute from '../src/routes/authRoute.js'
import courseRoute from './routes/courseroute.js'
import paymentRoute from './routes/payment.route.js'
import contactRout  from './routes/contactRoute.js'
import userStats  from './routes/userStats.route.js'

app.use('/api/v1/user', authRoute)
app.use('/api/v1/course', courseRoute)
app.use('/api/v1/payments', paymentRoute)
app.use('/api/v1/contact', contactRout)
app.use('/api/v1/admin', userStats)


connectDB()

.then(() => {
	app.listen(PORT, ()=>{
		console.log(`server is running at port : ${PORT}`)
	})
}).catch((err) => {
	console.log("Mongo Db Connection failed !!!", err);
})

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

