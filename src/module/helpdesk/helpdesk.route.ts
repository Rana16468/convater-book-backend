import express from 'express';
import validationRequest from '../../middleware/validationRequest';
import helpDeskValidation from './helpdesk.validation';
import helpDeskController from './helpdesk.controller';

const router=express.Router();

router.post("/create_help_desk", validationRequest(helpDeskValidation.createHelpDeskZodSchema), helpDeskController.createHelpDesk);
router.get("/all_help|_desk", helpDeskController.allHelpDesk);

const helpDeskRouter=router;
export default helpDeskRouter;
