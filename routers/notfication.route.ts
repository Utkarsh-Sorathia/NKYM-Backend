import express from 'express';
import { saveUserToken, sendCustomNotification } from '../controllers/notification.controller';

const router = express.Router();

router.post('/save-token', saveUserToken);
router.post('/send-custom', sendCustomNotification);

export default router;
