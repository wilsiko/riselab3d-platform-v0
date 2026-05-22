import { Router } from 'express';
import { sendInstitutionalContactEmail } from '../auth/email';

const router = Router();

router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: 'Informe nome, e-mail, telefone e mensagem.' });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Informe um e-mail valido para contato.' });
  }

  if (message.length < 10) {
    return res.status(400).json({ error: 'A mensagem precisa ter ao menos 10 caracteres.' });
  }

  try {
    await sendInstitutionalContactEmail({ name, email, phone, message });
  } catch (error) {
    console.error('Institutional contact email failed', error);
    return res.status(503).json({ error: 'O canal de contato por e-mail esta indisponivel no momento. Tente novamente em instantes.' });
  }

  return res.status(201).json({
    message: 'Recebemos sua mensagem. A equipe da RiseLab3D retornara pelo contato informado.',
  });
});

export default router;