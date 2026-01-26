import express from 'express';
import validationRequest from '../../middleware/validationRequest';
import UserValidationSchema from './user.validation';
import UserController from './user.controller';

const router = express.Router();

router.post(
  '/create_user',
  validationRequest(UserValidationSchema.createUserZodSchema),
  UserController.createUser,
);
router.patch(
  "/user_verification",
  validationRequest(UserValidationSchema.UserVerification),
  UserController.userVarification
);

const UserRouters = router;
export default UserRouters;
