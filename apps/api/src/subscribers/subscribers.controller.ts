import { Body, Controller, HttpCode, Post } from '@nestjs/common';

import { VerifyTokenDto } from './dto/verify.dto';
import { ReaderVerification, SubscribersService } from './subscribers.service';

@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribers: SubscribersService) {}

  /** `POST /api/subscribers/verify` — starea abonamentului unui cititor. */
  @Post('verify')
  @HttpCode(200)
  verify(@Body() dto: VerifyTokenDto): Promise<ReaderVerification> {
    return this.subscribers.verify(dto.token);
  }
}
