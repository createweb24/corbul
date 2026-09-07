import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  MessageKind,
  PartnerStatus,
  SubscriberStatus,
} from '../admin.types';

const MESSAGE_KINDS: MessageKind[] = ['contact', 'tip'];
const PARTNER_STATUSES: PartnerStatus[] = [
  'pending',
  'paid',
  'active',
  'expired',
];
const SUBSCRIBER_STATUSES: SubscriberStatus[] = [
  'pending',
  'active',
  'canceled',
  'past_due',
];

/** Listări simple: `?limit=` + filtre opționale. */
export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(120)
  q?: string;
}

export class MessagesQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(MESSAGE_KINDS, { message: 'Tip de mesaj necunoscut' })
  kind?: MessageKind;

  /** `?handled=true|false` — sosește ca string, îl convertim explicit. */
  @IsOptional()
  @Transform(({ value }): unknown => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  handled?: boolean;
}

export class SubscribersQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(SUBSCRIBER_STATUSES, { message: 'Status de abonat necunoscut' })
  status?: SubscriberStatus;
}

export class PartnersQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(PARTNER_STATUSES, { message: 'Status de partener necunoscut' })
  status?: PartnerStatus;
}

/** `PATCH /api/admin/messages/:id` `{handled}` */
export class UpdateMessageDto {
  @IsBoolean()
  handled!: boolean;
}

/** `PATCH /api/admin/partners/:id` `{status}` */
export class UpdatePartnerStatusDto {
  @IsIn(PARTNER_STATUSES, {
    message: 'Statusul trebuie să fie pending, paid, active sau expired',
  })
  status!: PartnerStatus;
}
