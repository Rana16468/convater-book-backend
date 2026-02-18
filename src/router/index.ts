import express from 'express';
import UserRouters from '../module/user/user.routes';
import AuthRouter from '../module/auth/auth.routes';
import OrderRoutes from '../module/order/order.route';
import orderTrackingRoute from '../module/order_tracking/order_tracking.route';
import helpDeskRouter from '../module/helpdesk/helpdesk.route';

const router = express.Router();
const moduleRouth = [
  { path: '/user', route: UserRouters },
  {path:"/auth", route:AuthRouter},
  {path:"/order", route:OrderRoutes },
  {path:"/order_tracking", route: orderTrackingRoute},
  {path:"/help_desk", route: helpDeskRouter}
];

moduleRouth.forEach((v) => router.use(v.path, v.route));

export default router;
