import { Router } from 'express';
import { adminLogin } from '../controllers/login.controller';

const router = Router();

router.post('/login', adminLogin);

export default router;
