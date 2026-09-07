import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Modul global: orice serviciu poate injecta PrismaService
 * fără să importe explicit PrismaModule.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
