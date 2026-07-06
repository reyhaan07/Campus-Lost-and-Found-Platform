import express from 'express';
import { createReport, getReports, getMyReports, getReportById, updateReport, deleteReport, resolveReport, getMatches } from '../controllers/reportController.js';
import auth from '../middlewares/auth.js';
import { uploadSingle } from '../middlewares/upload.js';
import { validateReport, validateReportUpdate } from '../middlewares/validate.js';

const router = express.Router();

router.post('/', auth, uploadSingle, validateReport, createReport);
router.get('/', getReports);
router.get('/my-reports', auth, getMyReports);
router.get('/:id/matches', auth, getMatches);
router.get('/:id', getReportById);
router.put('/:id', auth, validateReportUpdate, updateReport);
router.delete('/:id', auth, deleteReport);
router.put('/:id/resolve', auth, resolveReport);

export default router;
