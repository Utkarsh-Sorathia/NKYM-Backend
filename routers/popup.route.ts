import { Router } from 'express';
import multer from 'multer';
import { getEnabledPopupContent, addPopupContent, togglePopupContent } from '../controllers/popup.controller';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/popup-content', getEnabledPopupContent);
router.post('/popup-content',upload.single('file'), addPopupContent);
router.post('/popup-content/:id', togglePopupContent);

export default router;
