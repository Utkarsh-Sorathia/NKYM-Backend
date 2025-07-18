import express from 'express';
import { getNotificationLogs, saveUserToken, sendCustomNotification } from '../controllers/notification.controller';

const router = express.Router();

router.post('/save-token', saveUserToken);
router.post('/send-custom', sendCustomNotification);
router.get('/logs', getNotificationLogs);

export default router;
