import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth';
import { attachAuthUser } from './auth/session';
import { tenantMiddleware } from './middleware/tenant';
import { rateLimitMiddleware } from './middleware/rateLimit';
import printersRouter from './routes/printers';
import settingsRouter from './routes/settings';
import productsRouter from './routes/products';
import quotesRouter from './routes/quotes';
import dashboardRouter from './routes/dashboard';
import clientsRouter from './routes/clients';
import contactRouter from './routes/contact';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(attachAuthUser);
app.use(tenantMiddleware);
app.use(rateLimitMiddleware);

app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/printers', printersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/products', productsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/contact', contactRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

export default app;
