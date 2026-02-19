import express from 'express';
import validationRequest from '../../middleware/validationRequest';
import helpDeskValidation from './helpdesk.validation';
import helpDeskController from './helpdesk.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';

const router=express.Router();

router.post("/create_help_desk", validationRequest(helpDeskValidation.createHelpDeskZodSchema), helpDeskController.createHelpDesk);
router.get("/all_help_desk", auth(USER_ROLE.admin, USER_ROLE.superAdmin), helpDeskController.allHelpDesk);
router.patch("/is_checked_help_desk", auth(USER_ROLE.admin, USER_ROLE.superAdmin), validationRequest(helpDeskValidation.updateHelpDeskZodSchema),helpDeskController.isCheckedHelpDesk);
const helpDeskRouter=router;
export default helpDeskRouter;
