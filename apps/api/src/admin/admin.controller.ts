import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { AdminService } from './admin.service';
import {
  AdminArticleDto,
  AdminAuthorDto,
  AdminStatsDto,
  MessageDto,
  OkDto,
  PaginatedDto,
  PartnerDto,
  SubscriberDto,
} from './admin.types';
import {
  AdminArticleQueryDto,
  ArticleFlagsDto,
  CreateArticleDto,
  UpdateArticleDto,
} from './dto/article.dto';
import { CreateAuthorDto, UpdateAuthorDto } from './dto/author.dto';
import {
  MessagesQueryDto,
  PartnersQueryDto,
  SubscribersQueryDto,
  UpdateMessageDto,
  UpdatePartnerStatusDto,
} from './dto/moderation.dto';

/**
 * Zona de administrare (SPEC §4 — A2).
 * `JwtAuthGuard` la nivel de controller ⇒ TOATE rutele `/api/admin/*` sunt
 * protejate. Rutele fixe sunt declarate înaintea celor cu parametru.
 * `ParseIdPipe` limitează `:id` la intervalul `Int` din Prisma (400, nu 500).
 */
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /* --- statistici -------------------------------------------------- */

  @Get('stats')
  stats(): Promise<AdminStatsDto> {
    return this.admin.stats();
  }

  /* --- articole ---------------------------------------------------- */

  @Get('articles')
  listArticles(
    @Query() query: AdminArticleQueryDto,
  ): Promise<PaginatedDto<AdminArticleDto>> {
    return this.admin.listArticles(query);
  }

  @Get('articles/:id')
  getArticle(
    @Param('id', ParseIdPipe) id: number,
  ): Promise<AdminArticleDto> {
    return this.admin.getArticle(id);
  }

  @Post('articles')
  createArticle(@Body() dto: CreateArticleDto): Promise<AdminArticleDto> {
    return this.admin.createArticle(dto);
  }

  @Put('articles/:id')
  updateArticle(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateArticleDto,
  ): Promise<AdminArticleDto> {
    return this.admin.updateArticle(id, dto);
  }

  @Patch('articles/:id/flags')
  setArticleFlags(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: ArticleFlagsDto,
  ): Promise<AdminArticleDto> {
    return this.admin.setArticleFlags(id, dto);
  }

  @Delete('articles/:id')
  deleteArticle(@Param('id', ParseIdPipe) id: number): Promise<OkDto> {
    return this.admin.deleteArticle(id);
  }

  /* --- autori ------------------------------------------------------ */

  @Get('authors')
  listAuthors(): Promise<AdminAuthorDto[]> {
    return this.admin.listAuthors();
  }

  @Get('authors/:id')
  getAuthor(@Param('id', ParseIdPipe) id: number): Promise<AdminAuthorDto> {
    return this.admin.getAuthor(id);
  }

  @Post('authors')
  createAuthor(@Body() dto: CreateAuthorDto): Promise<AdminAuthorDto> {
    return this.admin.createAuthor(dto);
  }

  @Put('authors/:id')
  updateAuthor(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateAuthorDto,
  ): Promise<AdminAuthorDto> {
    return this.admin.updateAuthor(id, dto);
  }

  @Delete('authors/:id')
  deleteAuthor(@Param('id', ParseIdPipe) id: number): Promise<OkDto> {
    return this.admin.deleteAuthor(id);
  }

  /* --- mesaje (contact + ponturi) ---------------------------------- */

  @Get('messages')
  listMessages(@Query() query: MessagesQueryDto): Promise<MessageDto[]> {
    return this.admin.listMessages(query);
  }

  @Patch('messages/:id')
  updateMessage(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdateMessageDto,
  ): Promise<MessageDto> {
    return this.admin.setMessageHandled(id, dto.handled);
  }

  @Delete('messages/:id')
  deleteMessage(@Param('id', ParseIdPipe) id: number): Promise<OkDto> {
    return this.admin.deleteMessage(id);
  }

  /* --- abonați și parteneri ---------------------------------------- */

  @Get('subscribers')
  listSubscribers(
    @Query() query: SubscribersQueryDto,
  ): Promise<SubscriberDto[]> {
    return this.admin.listSubscribers(query);
  }

  @Get('partners')
  listPartners(@Query() query: PartnersQueryDto): Promise<PartnerDto[]> {
    return this.admin.listPartners(query);
  }

  @Patch('partners/:id')
  updatePartner(
    @Param('id', ParseIdPipe) id: number,
    @Body() dto: UpdatePartnerStatusDto,
  ): Promise<PartnerDto> {
    return this.admin.setPartnerStatus(id, dto.status);
  }
}
