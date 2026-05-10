import app from './app';
import dotenv from 'dotenv';
import { ensurePublicTenantSeed } from './auth/bootstrap';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

ensurePublicTenantSeed()
  .catch((error) => {
    console.error('Failed to ensure public tenant seed', error);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`RiseLab3D backend running on http://localhost:${port}`);
    });
  });
