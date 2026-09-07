import { Module } from '@nestjs/common';

import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';

/**
 * Abonați Premium: verificarea token-ului de cititor.
 * `SubscribersService` este exportat pentru paywall-ul din modulul de articole.
 */
@Module({
  controllers: [SubscribersController],
  providers: [SubscribersService],
  exports: [SubscribersService],
})
export class SubscribersModule {}
