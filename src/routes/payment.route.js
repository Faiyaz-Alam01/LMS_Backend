import {Router} from 'express'
import { allPayments, buySubscription, cancelSubscription, getRazorPayApiKey, verifySubscription } from '../controllers/payment.controller.js';
import { verifyJWT } from '../middleware/verifyJWT.js';
import { authorizedRoles, authorizedSubscriber } from '../middleware/auth.middleware.js';
const router = Router();

router.route('/razorpay-key').get(verifyJWT,getRazorPayApiKey)
router.route('/subscribe').post(verifyJWT,buySubscription)

router.route('/verify').post(verifyJWT,verifySubscription)

router.route('/unSubscribe').post(verifyJWT,authorizedSubscriber,cancelSubscription)
router.route('/')
	.get(verifyJWT,authorizedRoles('ADMIN'),allPayments)

export default router



