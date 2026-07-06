import express from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get('/', auth, getNotifications);
router.put('/:id/read', auth, markNotificationRead);

export default router;
