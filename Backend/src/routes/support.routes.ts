import { Router } from 'express';
import * as ctrl from '../controllers/support.controller';
import { protect } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { supportMessageSchema } from '../schemas/support.schema';

const router = Router();
router.use(protect);

router.post('/messages', validate(supportMessageSchema), ctrl.createSupportMessage);

export default router;
