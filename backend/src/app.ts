import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { auditLogger } from './middleware/auditLogger';

// Routes
import authRoutes from './routes/auth';
import bankRoutes from './routes/banks';
import accountRoutes from './routes/accounts';
import paymentRoutes from './routes/payments';
import transactionRoutes from './routes/transactions';
import consentRoutes from './routes/consents';
import developerRoutes from './routes/developer';
import marketplaceRoutes from './routes/marketplace';
import analyticsRoutes from './routes/analytics';
import sandboxRoutes from './routes/sandbox';

const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Rate limiting
app.use('/api/', rateLimiter);

// Audit logging
app.use(auditLogger);

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #0f172a; }',
  customSiteTitle: 'FinBridge API Docs',
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'FinBridge API is running', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/sandbox', sandboxRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

export default app;
