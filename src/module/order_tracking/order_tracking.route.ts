import express from 'express';
import validationRequest from '../../middleware/validationRequest';
import orderTrackingValidation from './order_tracking.validation';
import orderTrackingController from './order_tracking.controller';
import orderAuth from '../../middleware/orderAuth';
import { USER_ROLE } from '../user/user.constant';
import auth from '../../middleware/auth';
const router=express.Router();

router.post("/order_tracking_authenticator", validationRequest(orderTrackingValidation.orderTrackingSchema),orderTrackingController.forgotOrderAuthenticator);
router.get("/find_by_my_order_tracking", orderAuth(), orderTrackingController.findByMyOrderTracking);
router.get("/checked_order_tracking/:orderId",orderAuth(),orderTrackingController.OrderTracking );
router.patch(
  "/change_order_tracking_status/:orderId",
  auth(USER_ROLE.admin, USER_ROLE.superAdmin),
  validationRequest(orderTrackingValidation.orderTrackingUpdateZodSchema),
  orderTrackingController.changeOrderTrackingStatus
);

const orderTrackingRoute=router;

export default orderTrackingRoute;

