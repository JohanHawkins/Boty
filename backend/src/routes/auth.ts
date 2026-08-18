import { Router } from 'express';
import { register } from '../controllers/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(register));

export default router;
