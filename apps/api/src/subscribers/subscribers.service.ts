import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/** Răspunsul lui `POST /api/subscribers/verify` (SPEC §4). */
export interface ReaderVerification {
  active: boolean;
  plan: 'monthly' | 'annual' | null;
  currentPeriodEnd: string | null;
}

const INACTIVE: ReaderVerification = {
  active: false,
  plan: null,
  currentPeriodEnd: null,
};

@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifică un token opac de cititor. Nu divulgă nimic despre abonat
   * dincolo de plan și data de expirare.
   */
  async verify(rawToken: string): Promise<ReaderVerification> {
    const token = rawToken.trim();
    if (!token) return INACTIVE;

    const subscriber = await this.prisma.subscriber.findUnique({
      where: { accessToken: token },
      select: { status: true, plan: true, currentPeriodEnd: true },
    });
    if (!subscriber) return INACTIVE;

    const expired =
      subscriber.currentPeriodEnd !== null &&
      subscriber.currentPeriodEnd.getTime() < Date.now();
    const active = subscriber.status === 'active' && !expired;

    return {
      active,
      plan: normalizePlan(subscriber.plan),
      currentPeriodEnd: subscriber.currentPeriodEnd?.toISOString() ?? null,
    };
  }

  /**
   * Helper pentru paywall (A1): `true` doar pentru un abonament activ
   * și neexpirat.
   */
  async isActiveToken(token: string | undefined | null): Promise<boolean> {
    if (!token) return false;
    const result = await this.verify(token);
    return result.active;
  }
}

function normalizePlan(plan: string | null): 'monthly' | 'annual' | null {
  return plan === 'monthly' || plan === 'annual' ? plan : null;
}
