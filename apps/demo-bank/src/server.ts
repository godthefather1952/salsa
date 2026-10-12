import { buildBankApp } from './app';

const port = Number(process.env.DEMO_BANK_PORT ?? 4000);
const host = process.env.DEMO_BANK_HOST ?? '127.0.0.1';

const app = buildBankApp({
  salsaApiUrl: process.env.SALSA_API_URL ?? 'http://127.0.0.1:3001',
  salsaWidgetUrl: process.env.SALSA_WIDGET_URL ?? 'http://localhost:5173',
  logger: true,
});

await app.listen({ host, port });
app.log.info(`Demo banks ready at http://localhost:${port}`);
