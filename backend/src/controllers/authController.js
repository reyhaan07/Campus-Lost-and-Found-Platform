import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = catchAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new AppError(400, 'Email already registered'));

  const user = await User.create({ name, email, phone, password, role: 'user' });
  const token = signToken(user._id);

  res.status(201).json({ user: { ...user.toObject(), password: undefined }, token });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.isActive) return next(new AppError(401, 'Invalid credentials'));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new AppError(401, 'Invalid credentials'));

  const token = signToken(user._id);
  res.json({ user: { ...user.toObject(), password: undefined }, token });
});

export const getProfile = catchAsync(async (req, res) => {
  res.json({ user: req.user });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, phone, password } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError(404, 'User not found'));

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (password) user.password = password;

  await user.save();
  res.json({ user: { ...user.toObject(), password: undefined } });
});
