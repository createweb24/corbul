import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { INT32_MAX } from '../../common/int32';

const trim = (): PropertyDecorator =>
  Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  );

export class SourceInputDto {
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Sursa are nevoie de o etichetă' })
  @MaxLength(200)
  label!: string;

  @trim()
  @IsString()
  @MaxLength(500)
  url!: string;
}

/** Câmpurile comune de conținut, în forma brută (RO + RU). */
export class CreateArticleDto {
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @Type(() => Number)
  @IsInt({ message: 'Categoria este obligatorie' })
  @Min(1)
  @Max(INT32_MAX)
  categoryId!: number;

  @Type(() => Number)
  @IsInt({ message: 'Autorul este obligatoriu' })
  @Min(1)
  @Max(INT32_MAX)
  authorId!: number;

  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Titlul în română este obligatoriu' })
  @MaxLength(300)
  titleRo!: string;

  /** Opțional: dacă lipsește, serviciul copiază varianta RO. */
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(300)
  titleRu?: string;

  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Sumarul în română este obligatoriu' })
  @MaxLength(2000)
  summaryRo!: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(2000)
  summaryRu?: string;

  @IsString()
  @IsNotEmpty({ message: 'Conținutul în română este obligatoriu' })
  contentRo!: string;

  @IsOptional()
  @IsString()
  contentRu?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  tagsRo?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  tagsRu?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @ValidateNested({ each: true })
  @Type(() => SourceInputDto)
  sources?: SourceInputDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  coverSeed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  readMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(INT32_MAX)
  views?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Data publicării nu este validă' })
  publishedAt?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  breaking?: boolean;

  @IsOptional()
  @IsBoolean()
  premium?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

/** `PUT /api/admin/articles/:id` — actualizare parțială (toate opționale). */
export class UpdateArticleDto {
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INT32_MAX)
  authorId?: number;

  @IsOptional()
  @trim()
  @IsString()
  @IsNotEmpty({ message: 'Titlul în română nu poate fi gol' })
  @MaxLength(300)
  titleRo?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(300)
  titleRu?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(2000)
  summaryRo?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(2000)
  summaryRu?: string;

  @IsOptional()
  @IsString()
  contentRo?: string;

  @IsOptional()
  @IsString()
  contentRu?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  tagsRo?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  tagsRu?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(24)
  @ValidateNested({ each: true })
  @Type(() => SourceInputDto)
  sources?: SourceInputDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  coverSeed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  readMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(INT32_MAX)
  views?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Data publicării nu este validă' })
  publishedAt?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  breaking?: boolean;

  @IsOptional()
  @IsBoolean()
  premium?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

/** `PATCH /api/admin/articles/:id/flags` */
export class ArticleFlagsDto {
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  breaking?: boolean;

  @IsOptional()
  @IsBoolean()
  premium?: boolean;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

/** `GET /api/admin/articles?q=&category=&page=` */
export class AdminArticleQueryDto {
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(120)
  q?: string;

  /** slug de categorie sau id numeric */
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage?: number;
}
