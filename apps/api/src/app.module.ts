import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';

// public (A1)
import { ArticlesModule } from './articles/articles.module';
import { CategoriesModule } from './categories/categories.module';
import { AuthorsModule } from './authors/authors.module';
import { SearchModule } from './search/search.module';

// auth + admin (A2)
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { SettingsModule } from './settings/settings.module';

// widgeturi, plăți, inbox (A3)
import { WidgetsModule } from './widgets/widgets.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { InboxModule } from './inbox/inbox.module';

// publicitate (ADS-SPEC §2)
import { AdsModule } from './ads/ads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ArticlesModule,
    CategoriesModule,
    AuthorsModule,
    SearchModule,
    AuthModule,
    AdminModule,
    SettingsModule,
    WidgetsModule,
    PaymentsModule,
    SubscribersModule,
    InboxModule,
    AdsModule,
  ],
})
export class AppModule {}
