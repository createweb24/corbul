import { Transform } from 'class-transformer';
import { IsDefined, IsString, Matches, MaxLength } from 'class-validator';

/**
 * `PUT /api/admin/settings` `{key, value}`.
 * `value` are `@IsDefined()` ca să supraviețuiască `whitelist: true`
 * (ValidationPipe elimină proprietățile fără niciun decorator de validare).
 */
export class UpdateSettingDto {
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9_.-]*$/, {
    message: 'Cheia setării conține caractere nepermise',
  })
  key!: string;

  @IsDefined({ message: 'Valoarea setării lipsește' })
  value!: unknown;
}
