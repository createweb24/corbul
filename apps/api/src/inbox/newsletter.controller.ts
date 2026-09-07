import { Body, Controller, HttpCode, Ip, Post } from '@nestjs/common';

import { NewsletterDto } from './dto/newsletter.dto';
import { InboxService, OkResponse } from './inbox.service';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly inbox: InboxService) {}

  /** `POST /api/newsletter` — înscriere idempotentă la buletinul editorial. */
  @Post()
  @HttpCode(200)
  subscribe(
    @Body() dto: NewsletterDto,
    @Ip() ip: string,
  ): Promise<OkResponse> {
    return this.inbox.subscribeNewsletter(dto, ip || 'unknown');
  }
}
