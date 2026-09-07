import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/message.dto';
import { NewsletterDto } from './dto/newsletter.dto';
import { SlidingWindowLimiter } from '../common/rate-limit';

/** Răspuns uniform: nu confirmă și nu infirmă nimic despre starea internă. */
export interface OkResponse {
  ok: true;
}

const OK: OkResponse = { ok: true };

const HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  /** SPEC: maximum 5 mesaje pe IP pe oră. */
  private readonly messageLimiter = new SlidingWindowLimiter(5, HOUR_MS);

  /** Aceeași protecție, mai permisivă, pentru abonarea la newsletter. */
  private readonly newsletterLimiter = new SlidingWindowLimiter(10, HOUR_MS);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * `POST /api/newsletter` — upsert idempotent: o adresă deja înscrisă
   * își actualizează doar limba preferată.
   */
  async subscribeNewsletter(
    dto: NewsletterDto,
    ip: string,
  ): Promise<OkResponse> {
    if (!this.newsletterLimiter.take(ip)) {
      this.logger.warn(`Limită de înscrieri newsletter atinsă pentru ${ip}`);
      return OK;
    }

    const email = dto.email.trim().toLowerCase();
    const locale = dto.locale ?? 'ro';

    try {
      await this.prisma.newsletterSignup.upsert({
        where: { email },
        update: { locale },
        create: { email, locale },
      });
    } catch (error: unknown) {
      // Un duplicat sau o eroare de scriere nu trebuie să spargă formularul.
      this.logger.warn(
        `Înscriere newsletter eșuată pentru ${email}: ${describe(error)}`,
      );
    }
    return OK;
  }

  /**
   * `POST /api/messages` — contact și ponturi.
   * La depășirea limitei răspunde tot `{ ok: true }`, fără să divulge
   * existența limitei (SPEC §4).
   */
  async createMessage(dto: CreateMessageDto, ip: string): Promise<OkResponse> {
    if (!this.messageLimiter.take(ip)) {
      this.logger.warn(
        `Limită de mesaje atinsă pentru ${ip} — mesaj „${dto.kind}" ignorat`,
      );
      return OK;
    }

    const email = clean(dto.email);

    try {
      await this.prisma.message.create({
        data: {
          kind: dto.kind,
          name: clean(dto.name),
          email: email ? email.toLowerCase() : null,
          subject: clean(dto.subject),
          body: dto.body.trim(),
          handled: false,
        },
      });
      this.logger.log(`Mesaj nou (${dto.kind}) înregistrat`);
    } catch (error: unknown) {
      // Un pont pierdut în tăcere ar fi mai rău decât o eroare vizibilă:
      // expeditorul trebuie să știe că nu a ajuns și să reîncerce.
      this.logger.error(`Mesajul nu a putut fi salvat: ${describe(error)}`);
      throw new ServiceUnavailableException(
        'Mesajul nu a putut fi înregistrat. Încearcă din nou în câteva momente.',
      );
    }
    return OK;
  }
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
