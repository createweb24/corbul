import { Logger } from '@nestjs/common';

import { createApp, webUrl } from './bootstrap';

async function bootstrap(): Promise<void> {
  const app = await createApp();

  const port = Number(process.env.PORT ?? 4100);
  await app.listen(port);

  const logger = new Logger('Corbul');
  logger.log(`API Corbul.md pornit pe http://localhost:${port}/api`);
  logger.log(`CORS permis pentru ${webUrl()}`);
}

void bootstrap();
