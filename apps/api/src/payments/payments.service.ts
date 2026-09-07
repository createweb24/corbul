import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Partner } from '@prisma/client';
import Stripe from 'stripe';

import { PrismaService } from '../prisma/prisma.service';
import {
  Locale,
  Plan,
  PremiumCheckoutDto,
} from './dto/premium-checkout.dto';
import { PartnerCheckoutDto, PartnerTier } from './dto/partner-checkout.dto';
import { demoSessionId, isDemoSessionId, readerToken } from './tokens';

/* ------------------------------------------------------------------ */
/* Contracte de răspuns (oglindite în apps/web/src/lib/types.ts)       */
/* ------------------------------------------------------------------ */

export interface CheckoutResponse {
  /** `null` în modul demonstrativ (fără chei Stripe reale). */
  url: string | null;
  demo?: boolean;
  message?: string;
  /**
   * Extensii peste `CheckoutResponseDto`, utile în modul demonstrativ:
   * pagina de succes poate fi deschisă direct pe `successUrl`, care conține
   * deja `session_id=demo_…`.
   */
  sessionId?: string;
  successUrl?: string;
  /** `true` când adresa are deja un abonament activ — nu s-a creat nimic nou. */
  alreadyActive?: boolean;
}

export interface PaymentSession {
  status: string;
  email: string | null;
  accessToken?: string;
}

export interface PricingSettings {
  premiumMonthly: number;
  premiumAnnual: number;
  currency: string;
  tiers: Record<PartnerTier, number>;
}

/** Aceleași valori ca în seed — folosite dacă setarea `pricing` lipsește. */
const DEFAULT_PRICING: PricingSettings = {
  premiumMonthly: 149,
  premiumAnnual: 1490,
  currency: 'MDL',
  tiers: { bronze: 9900, silver: 19900, gold: 39900 },
};

const PLAN_LABEL: Record<Plan, Record<Locale, string>> = {
  monthly: {
    ro: 'Corbul Premium — abonament lunar',
    ru: 'Corbul Premium — месячная подписка',
  },
  annual: {
    ro: 'Corbul Premium — abonament anual',
    ru: 'Corbul Premium — годовая подписка',
  },
};

const TIER_LABEL: Record<PartnerTier, Record<Locale, string>> = {
  bronze: { ro: 'Bronz', ru: 'Бронза' },
  silver: { ro: 'Argint', ru: 'Серебро' },
  gold: { ro: 'Aur', ru: 'Золото' },
};

const ALREADY_ACTIVE_MESSAGE: Record<Locale, string> = {
  ro:
    'Această adresă are deja un abonament Corbul Premium activ. ' +
    'Nu a fost creată nicio plată nouă.',
  ru:
    'У этого адреса уже есть активная подписка Corbul Premium. ' +
    'Новый платёж не создавался.',
};

const DEMO_MESSAGE: Record<Locale, string> = {
  ro:
    'Mod demonstrativ: Stripe nu este configurat pe acest server. ' +
    'Solicitarea a fost înregistrată în baza de date, iar accesul se ' +
    'activează local, fără plată reală.',
  ru:
    'Демонстрационный режим: Stripe не настроен на этом сервере. ' +
    'Заявка сохранена в базе данных, доступ активируется локально, ' +
    'без реальной оплаты.',
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // Cheie lipsă sau placeholder ⇒ mod demonstrativ (SPEC §4).
    const key = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    this.stripe =
      key && !key.startsWith('sk_test_placeholder') ? new Stripe(key) : null;
    if (!this.stripe) {
      this.logger.warn(
        'STRIPE_SECRET_KEY lipsește sau este placeholder — plățile rulează în mod demonstrativ',
      );
    }
  }

  /** `true` dacă serverul nu are chei Stripe reale. */
  get isDemo(): boolean {
    return this.stripe === null;
  }

  /* ---------------------------------------------------------------- */
  /* Abonament Premium                                                 */
  /* ---------------------------------------------------------------- */

  async premiumCheckout(dto: PremiumCheckoutDto): Promise<CheckoutResponse> {
    const locale = dto.locale ?? 'ro';
    const email = dto.email.trim().toLowerCase();
    const plan = dto.plan;
    const pricing = await this.pricing();

    const amountMdl =
      plan === 'annual' ? pricing.premiumAnnual : pricing.premiumMonthly;

    // Un abonat deja activ nu primește un al doilea abonament și nu i se
    // schimbă planul înainte de vreo plată (statisticile ar număra prețul nou).
    const current = await this.prisma.subscriber.findUnique({
      where: { email },
      select: { status: true, currentPeriodEnd: true },
    });
    if (current && isActiveSubscription(current)) {
      this.logger.log(`Checkout refuzat: ${email} are deja abonament activ`);
      return {
        url: null,
        alreadyActive: true,
        message: ALREADY_ACTIVE_MESSAGE[locale],
      };
    }

    // Înregistrarea locală există indiferent de modul de plată; planul se
    // actualizează doar pentru abonații încă neplătiți (pending/canceled).
    const subscriber = await this.prisma.subscriber.upsert({
      where: { email },
      update: { plan },
      create: {
        email,
        plan,
        status: 'pending',
        accessToken: readerToken(),
      },
    });

    if (!this.stripe) {
      const sessionId = demoSessionId();
      await this.prisma.subscriber.update({
        where: { id: subscriber.id },
        data: { stripeCustomerId: sessionId },
      });
      this.logger.log(
        `[demo] Abonament ${plan} înregistrat pentru ${email} (${sessionId})`,
      );
      return {
        url: null,
        demo: true,
        message: DEMO_MESSAGE[locale],
        sessionId,
        successUrl: this.successUrl(locale, sessionId),
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: pricing.currency.toLowerCase(),
            unit_amount: Math.round(amountMdl * 100),
            recurring: { interval: plan === 'annual' ? 'year' : 'month' },
            product_data: { name: PLAN_LABEL[plan][locale] },
          },
        },
      ],
      metadata: {
        kind: 'premium',
        subscriberId: String(subscriber.id),
        email,
        plan,
      },
      subscription_data: {
        metadata: {
          kind: 'premium',
          subscriberId: String(subscriber.id),
          email,
          plan,
        },
      },
      success_url: this.successUrl(locale, '{CHECKOUT_SESSION_ID}'),
      cancel_url: `${this.webUrl()}/${locale}/abonament`,
    });

    return { url: session.url };
  }

  /* ---------------------------------------------------------------- */
  /* Parteneriate B2B                                                  */
  /* ---------------------------------------------------------------- */

  async partnerCheckout(dto: PartnerCheckoutDto): Promise<CheckoutResponse> {
    const locale = dto.locale ?? 'ro';
    const months = dto.months ?? 1;
    const pricing = await this.pricing();
    const amountMdl = pricing.tiers[dto.tier] * months;

    const partner = await this.prisma.partner.create({
      data: {
        company: dto.company.trim(),
        contactName: dto.contactName.trim(),
        email: dto.email.trim().toLowerCase(),
        tier: dto.tier,
        months,
        amountMdl,
        status: 'pending',
        websiteUrl: dto.websiteUrl?.trim() || null,
      },
    });

    if (!this.stripe) {
      const sessionId = demoSessionId();
      await this.prisma.partner.update({
        where: { id: partner.id },
        data: { stripeSessionId: sessionId },
      });
      this.logger.log(
        `[demo] Parteneriat ${dto.tier} × ${months} luni pentru ${partner.company} (${sessionId})`,
      );
      return {
        url: null,
        demo: true,
        message: DEMO_MESSAGE[locale],
        sessionId,
        successUrl: this.successUrl(locale, sessionId),
      };
    }

    const name =
      locale === 'ru'
        ? `Партнёрство Corbul.md — пакет «${TIER_LABEL[dto.tier].ru}» (${months} мес.)`
        : `Parteneriat Corbul.md — pachet „${TIER_LABEL[dto.tier].ro}" (${months} luni)`;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: partner.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: pricing.currency.toLowerCase(),
            unit_amount: Math.round(amountMdl * 100),
            product_data: { name },
          },
        },
      ],
      metadata: {
        kind: 'partner',
        partnerId: String(partner.id),
        tier: dto.tier,
        months: String(months),
      },
      success_url: this.successUrl(locale, '{CHECKOUT_SESSION_ID}'),
      cancel_url: `${this.webUrl()}/${locale}/abonament`,
    });

    await this.prisma.partner.update({
      where: { id: partner.id },
      data: { stripeSessionId: session.id },
    });

    return { url: session.url };
  }

  /* ---------------------------------------------------------------- */
  /* Webhook Stripe                                                    */
  /* ---------------------------------------------------------------- */

  /**
   * Nu aruncă în modul demonstrativ: răspunde 200 și loghează (SPEC §4).
   * `invalid` semnalează controller-ului o semnătură greșită pe un server
   * cu Stripe configurat corect.
   */
  async handleWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): Promise<{ received: boolean; demo?: boolean; invalid?: boolean }> {
    const rawSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.trim();
    const secret =
      rawSecret && !rawSecret.startsWith('whsec_placeholder') ? rawSecret : null;

    if (!this.stripe || !secret) {
      this.logger.log(
        '[demo] Webhook Stripe primit, dar cheile nu sunt configurate — ignorat',
      );
      return { received: true, demo: true };
    }
    if (!rawBody || !signature) {
      this.logger.warn('Webhook Stripe fără corp brut sau fără semnătură');
      return { received: false, invalid: true };
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (error: unknown) {
      this.logger.warn(
        `Semnătură de webhook invalidă: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { received: false, invalid: true };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.onCheckoutCompleted(event.data.object);
          break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.onSubscriptionChanged(event.data.object);
          break;
        default:
          this.logger.debug(`Eveniment Stripe ignorat: ${event.type}`);
      }
    } catch (error: unknown) {
      // Un eșec de procesare nu trebuie să provoace reîncercări infinite.
      this.logger.error(
        `Eroare la procesarea evenimentului ${event.type}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return { received: true };
  }

  private async onCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const kind = session.metadata?.kind;

    if (kind === 'partner') {
      const partnerId = Number(session.metadata?.partnerId);
      const partner = Number.isFinite(partnerId)
        ? await this.prisma.partner.findUnique({ where: { id: partnerId } })
        : await this.prisma.partner.findFirst({
            where: { stripeSessionId: session.id },
          });
      if (partner) {
        await this.activatePartner(partner, session.id);
        this.logger.log(`Parteneriat activat: ${partner.company} (#${partner.id})`);
      }
      return;
    }

    // Implicit: abonament Premium.
    const email =
      session.customer_details?.email ??
      session.customer_email ??
      session.metadata?.email ??
      null;
    const subscriberId = Number(session.metadata?.subscriberId);

    const subscriber = Number.isFinite(subscriberId)
      ? await this.prisma.subscriber.findUnique({ where: { id: subscriberId } })
      : email
        ? await this.prisma.subscriber.findUnique({ where: { email } })
        : null;
    if (!subscriber) {
      this.logger.warn(
        `checkout.session.completed fără abonat corespondent (${session.id})`,
      );
      return;
    }

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription?.id ?? null);
    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : (session.customer?.id ?? null);

    let periodEnd: Date | null = null;
    if (subscriptionId && this.stripe) {
      try {
        const subscription =
          await this.stripe.subscriptions.retrieve(subscriptionId);
        periodEnd = periodEndOf(subscription);
      } catch (error: unknown) {
        this.logger.warn(
          `Nu am putut citi abonamentul ${subscriptionId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    await this.prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'active',
        stripeCustomerId: customerId ?? subscriber.stripeCustomerId,
        stripeSubscriptionId: subscriptionId ?? subscriber.stripeSubscriptionId,
        currentPeriodEnd:
          periodEnd ??
          addMonths(new Date(), subscriber.plan === 'annual' ? 12 : 1),
      },
    });
    this.logger.log(`Abonat Premium activat: ${subscriber.email}`);
  }

  private async onSubscriptionChanged(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const status = mapSubscriptionStatus(subscription.status);
    const periodEnd = periodEndOf(subscription);

    const updated = await this.prisma.subscriber.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status,
        ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      },
    });
    if (updated.count === 0) {
      const email = subscription.metadata?.email;
      if (email) {
        await this.prisma.subscriber.updateMany({
          where: { email },
          data: {
            status,
            stripeSubscriptionId: subscription.id,
            ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
          },
        });
      }
    }
    this.logger.log(
      `Abonament ${subscription.id} sincronizat cu statusul „${status}"`,
    );
  }

  /* ---------------------------------------------------------------- */
  /* Starea unei sesiuni de plată                                      */
  /* ---------------------------------------------------------------- */

  /**
   * `GET /api/payments/session/:id` — pagina de succes preia de aici
   * token-ul de cititor și îl scrie în cookie-ul `corbul_reader`.
   */
  async session(id: string): Promise<PaymentSession> {
    if (isDemoSessionId(id)) {
      return this.demoSession(id);
    }
    if (!this.stripe) {
      return { status: 'unknown', email: null };
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.checkout.sessions.retrieve(id);
    } catch (error: unknown) {
      this.logger.warn(
        `Sesiunea Stripe ${id} nu a putut fi citită: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { status: 'unknown', email: null };
    }

    const paid =
      session.payment_status === 'paid' ||
      session.payment_status === 'no_payment_required' ||
      session.status === 'complete';

    if (session.metadata?.kind === 'partner') {
      const partner = await this.prisma.partner.findFirst({
        where: { stripeSessionId: session.id },
      });
      if (!partner) return { status: 'unknown', email: null };
      if (paid && partner.status === 'pending') {
        await this.activatePartner(partner, session.id);
        return { status: 'active', email: partner.email };
      }
      return { status: partner.status, email: partner.email };
    }

    const email =
      session.customer_details?.email ??
      session.customer_email ??
      session.metadata?.email ??
      null;
    const subscriberId = Number(session.metadata?.subscriberId);
    const subscriber = Number.isFinite(subscriberId)
      ? await this.prisma.subscriber.findUnique({ where: { id: subscriberId } })
      : email
        ? await this.prisma.subscriber.findUnique({ where: { email } })
        : null;

    if (!subscriber) return { status: paid ? 'paid' : 'pending', email };

    // În dezvoltare webhook-ul poate lipsi: pagina de succes îl suplinește.
    if (paid && subscriber.status !== 'active') {
      const activated = await this.prisma.subscriber.update({
        where: { id: subscriber.id },
        data: {
          status: 'active',
          currentPeriodEnd:
            subscriber.currentPeriodEnd ??
            addMonths(new Date(), subscriber.plan === 'annual' ? 12 : 1),
        },
      });
      return {
        status: 'active',
        email: activated.email,
        accessToken: activated.accessToken,
      };
    }

    return {
      status: subscriber.status,
      email: subscriber.email,
      accessToken:
        subscriber.status === 'active' ? subscriber.accessToken : undefined,
    };
  }

  /** Sesiune `demo_…`: activează local abonatul sau partenerul. */
  private async demoSession(id: string): Promise<PaymentSession> {
    const partner = await this.prisma.partner.findFirst({
      where: { stripeSessionId: id },
    });
    if (partner) {
      const active =
        partner.status === 'pending'
          ? await this.activatePartner(partner, id)
          : partner;
      return { status: active.status, email: active.email };
    }

    const subscriber = await this.prisma.subscriber.findFirst({
      where: { stripeCustomerId: id },
    });
    if (!subscriber) {
      return { status: 'unknown', email: null };
    }

    const active =
      subscriber.status === 'active'
        ? subscriber
        : await this.prisma.subscriber.update({
            where: { id: subscriber.id },
            data: {
              status: 'active',
              stripeSubscriptionId:
                subscriber.stripeSubscriptionId ?? `demo_sub_${subscriber.id}`,
              currentPeriodEnd: addMonths(
                new Date(),
                subscriber.plan === 'annual' ? 12 : 1,
              ),
            },
          });

    return {
      status: 'active',
      email: active.email,
      accessToken: active.accessToken,
    };
  }

  private async activatePartner(
    partner: Partner,
    sessionId: string,
  ): Promise<Partner> {
    const startsAt = partner.startsAt ?? new Date();
    return this.prisma.partner.update({
      where: { id: partner.id },
      data: {
        status: 'active',
        stripeSessionId: partner.stripeSessionId ?? sessionId,
        startsAt,
        endsAt: addMonths(startsAt, partner.months),
      },
    });
  }

  /* ---------------------------------------------------------------- */
  /* Utilitare                                                         */
  /* ---------------------------------------------------------------- */

  /** Setarea `pricing`, cu valorile din seed ca plasă de siguranță. */
  async pricing(): Promise<PricingSettings> {
    try {
      const row = await this.prisma.setting.findUnique({
        where: { key: 'pricing' },
      });
      return mergePricing(row?.value);
    } catch (error: unknown) {
      this.logger.warn(
        `Setarea „pricing" nu a putut fi citită: ${error instanceof Error ? error.message : String(error)}`,
      );
      return DEFAULT_PRICING;
    }
  }

  private webUrl(): string {
    return (
      this.config.get<string>('WEB_URL') ?? 'http://localhost:3100'
    ).replace(/\/+$/, '');
  }

  private successUrl(locale: Locale, sessionId: string): string {
    return `${this.webUrl()}/${locale}/abonament/succes?session_id=${sessionId}`;
  }
}

/* ------------------------------------------------------------------ */
/* Funcții pure                                                        */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Aceeași regulă ca paywall-ul și `POST /api/subscribers/verify`. */
function isActiveSubscription(subscriber: {
  status: string;
  currentPeriodEnd: Date | null;
}): boolean {
  return (
    subscriber.status === 'active' &&
    (subscriber.currentPeriodEnd === null ||
      subscriber.currentPeriodEnd.getTime() > Date.now())
  );
}

function positive(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

/** Normalizează setarea `pricing` (Json liber) la forma tipată. */
export function mergePricing(value: unknown): PricingSettings {
  if (!isRecord(value)) return DEFAULT_PRICING;
  const tiers = isRecord(value.tiers) ? value.tiers : {};
  return {
    premiumMonthly: positive(
      value.premiumMonthly,
      DEFAULT_PRICING.premiumMonthly,
    ),
    premiumAnnual: positive(value.premiumAnnual, DEFAULT_PRICING.premiumAnnual),
    currency:
      typeof value.currency === 'string' && value.currency.trim()
        ? value.currency.trim()
        : DEFAULT_PRICING.currency,
    tiers: {
      bronze: positive(tiers.bronze, DEFAULT_PRICING.tiers.bronze),
      silver: positive(tiers.silver, DEFAULT_PRICING.tiers.silver),
      gold: positive(tiers.gold, DEFAULT_PRICING.tiers.gold),
    },
  };
}

/**
 * În API-ul Stripe 2025 (`basil`) `current_period_end` a coborât pe
 * elementele abonamentului — de aceea îl citim din `items.data[0]`.
 */
function periodEndOf(subscription: Stripe.Subscription): Date | null {
  const seconds = subscription.items.data[0]?.current_period_end;
  return typeof seconds === 'number' && Number.isFinite(seconds)
    ? new Date(seconds * 1000)
    : null;
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'pending';
  }
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCMonth(result.getUTCMonth() + months);
  // 31 ianuarie + 1 lună ⇒ 28/29 februarie, nu 3 martie.
  if (result.getUTCDate() < day) result.setUTCDate(0);
  return result;
}
