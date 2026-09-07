import { Module } from '@nestjs/common';

import { InboxService } from './inbox.service';
import { MessagesController } from './messages.controller';
import { NewsletterController } from './newsletter.controller';

/**
 * Corespondența publică: înscrieri la newsletter (`/api/newsletter`)
 * și mesaje de contact / ponturi (`/api/messages`).
 */
@Module({
  controllers: [NewsletterController, MessagesController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
