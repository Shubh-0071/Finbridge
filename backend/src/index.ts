import 'dotenv/config';
import app from './app';
import { initializeDatabase } from './db/database';

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    initializeDatabase();
    console.log('✅ Database initialized');

    app.listen(PORT, () => {
      console.log(`🚀 FinBridge API running on http://localhost:${PORT}`);
      console.log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
