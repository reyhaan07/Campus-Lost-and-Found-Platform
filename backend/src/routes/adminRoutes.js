import express from 'express';
import { getUsers, deactivateUser, getAllReports, deleteReportAdmin, getStats } from '../controllers/adminController.js';
import auth from '../middlewares/auth.js';
import admin from '../middlewares/admin.js';

const router = express.Router();

router.get('/users', auth, admin, getUsers);
router.put('/users/:id/deactivate', auth, admin, deactivateUser);
router.get('/reports', auth, admin, getAllReports);
router.delete('/reports/:id', auth, admin, deleteReportAdmin);
router.get('/stats', auth, admin, getStats);

export default router;
