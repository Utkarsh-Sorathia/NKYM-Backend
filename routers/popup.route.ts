import { Router } from 'express';
import { getEnabledPopupContent, addPopupContent } from '../controllers/popup.controller';

const router = Router();

router.get('/popup-content', getEnabledPopupContent);
router.post('/popup-content', addPopupContent);

export default router;
