import express from 'express';
import auth from '../middlewares/auth.js';
import { getMessages, sendMessage } from '../controllers/chatController.js';

const router = express.Router();

router.get('/:reportId', auth, getMessages);
router.post('/:reportId', auth, sendMessage);

export default router;
