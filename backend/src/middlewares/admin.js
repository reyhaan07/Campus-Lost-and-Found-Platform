import AppError from '../utils/AppError.js';

const admin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError(403, 'Access denied. Admin only.'));
  }
  next();
};

export default admin;
