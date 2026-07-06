import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import auth from '../middlewares/auth.js';
import { validateRegister, validateLogin, validateProfileUpdate } from '../middlewares/validate.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many failed login attempts. Please wait 15 minutes and try again.' },
});

router.post('/register', validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, validateProfileUpdate, updateProfile);

export default router;
