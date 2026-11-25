import 'dotenv/config';
import app from '../server/app.js';
import { connectDB, db } from '../server/db.js';

export default async function handler(req, res) {
  if (!db.isCloudConnected()) {
    try {
      await connectDB();
    } catch (err) {
      console.error('[Vercel Serverless] DB connection error:', err.message);
    }
  }
  return app(req, res);
}
