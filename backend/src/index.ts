import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`RiseLab3D backend running on http://localhost:${port}`);
});
