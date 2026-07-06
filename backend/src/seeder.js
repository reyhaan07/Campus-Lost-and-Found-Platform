import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/db.js';
import User from './models/User.js';

const seedAdmin = async () => {
  await connectDB();
  const existingAdmin = await User.findOne({ email: 'admin@campus.com' });
  if (!existingAdmin) {
    await User.create({
      name: 'Admin User',
      email: 'admin@campus.com',
      phone: '9999999999',
      password: 'Admin@123',
      role: 'admin',
    });
    console.log('Admin seeded');
  } else {
    console.log('Admin already exists');
  }
  process.exit(0);
};

seedAdmin();
