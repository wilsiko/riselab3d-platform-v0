import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tenantMiddleware } from './middleware/tenant';
import { rateLimitMiddleware } from './middleware/rateLimit';
import printersRouter from './routes/printers';
import filamentsRouter from './routes/filaments';
import settingsRouter from './routes/settings';
import productsRouter from './routes/products';
import quotesRouter from './routes/quotes';
import dashboardRouter from './routes/dashboard';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(tenantMiddleware);
app.use(rateLimitMiddleware);

app.use('/api/dashboard', dashboardRouter);
app.use('/api/printers', printersRouter);
app.use('/api/filaments', filamentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/products', productsRouter);
app.use('/api/quotes', quotesRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

export default app;
