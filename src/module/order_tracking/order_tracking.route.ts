import express from 'express';
import validationRequest from '../../middleware/validationRequest';
import orderTrackingValidation from './order_tracking.validation';
import orderTrackingController from './order_tracking.controller';
import orderAuth from '../../middleware/orderAuth';
const router=express.Router();

router.post("/order_tracking_authenticator", validationRequest(orderTrackingValidation.orderTrackingSchema),orderTrackingController.forgotOrderAuthenticator);
router.get("/find_by_my_order_tracking", orderAuth(), orderTrackingController.findByMyOrderTracking);
const orderTrackingRoute=router;

export default orderTrackingRoute;

