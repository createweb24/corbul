import { Body, Controller, HttpCode, Ip, Post } from '@nestjs/common';

import { CreateMessageDto } from './dto/message.dto';
import { InboxService, OkResponse } from './inbox.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly inbox: InboxService) {}

  /**
   * `POST /api/messages` — formularul de contact și „Trimite un pont securizat".
   * Limită de 5 mesaje pe IP pe oră; la depășire răspunde tot `{ ok: true }`.
   */
  @Post()
  @HttpCode(200)
  create(
    @Body() dto: CreateMessageDto,
    @Ip() ip: string,
  ): Promise<OkResponse> {
    return this.inbox.createMessage(dto, ip || 'unknown');
  }
}
