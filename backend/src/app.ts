import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';
import { rateLimitMiddleware } from './middleware/rateLimit';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import printerModelsRouter from './routes/printerModels';
import productColorsRouter from './routes/productColors';
import printersRouter from './routes/printers';
import filamentsRouter from './routes/filaments';
import settingsRouter from './routes/settings';
import productsRouter from './routes/products';
import quotesRouter from './routes/quotes';
import dashboardRouter from './routes/dashboard';
import feedbackRouter from './routes/feedback';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(rateLimitMiddleware);

app.use('/api/auth', authRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use(authMiddleware);
app.use(tenantMiddleware);

app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/printer-models', printerModelsRouter);
app.use('/api/product-colors', productColorsRouter);
app.use('/api/printers', printersRouter);
app.use('/api/filaments', filamentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/products', productsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/feedback', feedbackRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'O logo enviado excede o limite aceito pelo servidor.' });
  }

  console.error(err);
  res.status(500).json({ error: err?.message || 'Erro interno do servidor' });
});

export default app;
