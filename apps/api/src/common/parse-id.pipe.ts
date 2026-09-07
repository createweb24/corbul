import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { INT32_MAX, isDatabaseId } from './int32';

/**
 * Înlocuitor pentru `ParseIntPipe` la parametrii `:id`: acceptă doar întregi
 * în intervalul 1..2 147 483 647 (coloanele `Int` din Prisma). Orice altceva
 * primește 400, nu 500 din driverul PostgreSQL.
 *
 * `ValidationPipe({ transform: true })` global convertește deja parametrul
 * la `number` (după metatipul `id: number`), deci acceptăm ambele forme.
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<string | number, number> {
  transform(value: string | number): number {
    const raw = typeof value === 'number' ? String(value) : String(value ?? '').trim();
    if (!/^\d+$/.test(raw)) {
      throw new BadRequestException(
        'Identificatorul trebuie să fie un număr întreg pozitiv',
      );
    }
    const id = Number(raw);
    if (!isDatabaseId(id)) {
      throw new BadRequestException(
        `Identificatorul trebuie să fie între 1 și ${INT32_MAX}`,
      );
    }
    return id;
  }
}
