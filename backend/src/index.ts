import app from './app';
import dotenv from 'dotenv';
import { ensurePublicTenantSeed } from './auth/bootstrap';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`RiseLab3D backend running on http://localhost:${port}`);

  ensurePublicTenantSeed()
    .then(() => {
      console.log('Public tenant seed ensured');
    })
    .catch((error) => {
      console.error('Failed to ensure public tenant seed', error);
    });
});
