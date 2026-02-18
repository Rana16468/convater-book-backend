import express from 'express';
import { ContructRouter } from '../module/contract/contract.routes';
import UserRouters from '../module/user/user.routes';
import AuthRouter from '../module/auth/auth.routes';
import OrderRoutes from '../module/order/order.route';
import orderTrackingRoute from '../module/order_tracking/order_tracking.route';

const router = express.Router();
const moduleRouth = [
  { path: '/contract', route: ContructRouter },
  { path: '/user', route: UserRouters },
  {path:"/auth", route:AuthRouter},
  {path:"/order", route:OrderRoutes },
  {path:"/order_tracking", route: orderTrackingRoute}
];

moduleRouth.forEach((v) => router.use(v.path, v.route));

export default router;
