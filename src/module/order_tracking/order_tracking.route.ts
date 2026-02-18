import express from 'express';
import validationRequest from '../../middleware/validationRequest';
import orderTrackingValidation from './order_tracking.validation';
import orderTrackingController from './order_tracking.controller';
const router=express.Router();

router.post("/order_tracking_authenticator", validationRequest(orderTrackingValidation.orderTrackingSchema),orderTrackingController.forgotOrderAuthenticator);
const orderTrackingRoute=router;

export default orderTrackingRoute;

