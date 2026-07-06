import dotenv from 'dotenv';
import dns from 'node:dns';
dotenv.config();

const dnsServers = process.env.DNS_SERVERS
  ?.split(',')
  .map((server) => server.trim())
  .filter(Boolean);

if (dnsServers?.length) {
  dns.setServers(dnsServers);
}

import app from './src/app.js';
import connectDB from './src/config/db.js';
import { loadClipModel } from './src/config/aiConfig.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const requiredVariables = [
    'MONGO_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);
  if (missingVariables.length) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(', ')}`);
  }

  await connectDB();
  await loadClipModel().catch((error) => {
    console.warn('AI model failed to load, continuing with text fallback', error.message);
  });
  app.listen(PORT, () => {
    console.log(`CampusConnect backend running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Backend startup failed', error.message);
  process.exit(1);
});
