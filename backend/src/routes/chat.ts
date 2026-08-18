import { Router } from 'express';
import { chat } from '../controllers/chat.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/', asyncHandler(chat));

export default router;
