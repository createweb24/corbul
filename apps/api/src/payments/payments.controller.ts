import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { PartnerCheckoutDto } from './dto/partner-checkout.dto';
import { PremiumCheckoutDto } from './dto/premium-checkout.dto';
import {
  CheckoutResponse,
  PaymentSession,
  PaymentsService,
} from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** `POST /api/payments/premium/checkout` — abonament Corbul Premium. */
  @Post('premium/checkout')
  @HttpCode(200)
  premiumCheckout(@Body() dto: PremiumCheckoutDto): Promise<CheckoutResponse> {
    return this.payments.premiumCheckout(dto);
  }

  /** `POST /api/payments/partner/checkout` — pachet de parteneriat B2B. */
  @Post('partner/checkout')
  @HttpCode(200)
  partnerCheckout(@Body() dto: PartnerCheckoutDto): Promise<CheckoutResponse> {
    return this.payments.partnerCheckout(dto);
  }

  /**
   * `POST /api/payments/webhook` — corp brut (`rawBody: true` în `main.ts`).
   * Fără chei Stripe reale răspunde 200 și doar loghează.
   */
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ): Promise<{ received: boolean; demo?: boolean }> {
    const result = await this.payments.handleWebhook(req.rawBody, signature);
    if (result.invalid) {
      throw new BadRequestException('Semnătură de webhook invalidă');
    }
    return { received: result.received, demo: result.demo };
  }

  /** `GET /api/payments/session/:id` — starea plății + token-ul de cititor. */
  @Get('session/:id')
  session(@Param('id') id: string): Promise<PaymentSession> {
    return this.payments.session(id);
  }
}
