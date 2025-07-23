import { Router } from 'express';
import { getEnabledPopupContent, addPopupContent, togglePopupContent } from '../controllers/popup.controller';

const router = Router();

router.get('/popup-content', getEnabledPopupContent);
router.post('/popup-content', addPopupContent);
router.post('/popup-content/:id', togglePopupContent);

export default router;
