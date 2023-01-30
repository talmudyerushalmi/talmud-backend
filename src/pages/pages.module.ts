import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MishnaController } from './mishna.controller';
import { PagesService } from './pages.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MishnaSchema } from './schemas/mishna.schema';
import { Tractate, TractateSchema } from './schemas/tractate.schema';
import { ConsoleModule } from 'nestjs-console';
import { Mishna } from './schemas/mishna.schema';
import { TractateRepository } from './tractate.repository';
import { MishnaRepository } from './mishna.repository';
import { EditMishnaController } from './edit.mishna.controller';
import { EditMishnaExcerptController } from './edit.excerpt.controller';
import { SettingsModule } from 'src/settings/settings.module';
import { TractatesController } from './tractates/tractates.controller';
import { SublineService } from './subline.service';
import { AuthMiddleware } from 'src/middleware/auth';
import { NavigationtController } from './navigation.controller';
import { NavigationService } from './navigation.service';
import { RelatedController } from './related.controller';
import { RelatedService } from './related.service';
import { Related } from './models/related.model';
import { RelatedSchema } from './schemas/related.schema';
import { RelatedRepository } from './related.repository';
import { UserMiddleware } from 'src/middleware/userType';
import { LineService } from './line.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tractate.name, schema: TractateSchema },
      { name: Mishna.name, schema: MishnaSchema },
      { name: Related.name, schema: RelatedSchema },
    ]),
    ConsoleModule,
    SettingsModule,
  ],
  controllers: [
    TractatesController,
    NavigationtController,
    RelatedController,
    MishnaController,
    EditMishnaController,
    EditMishnaExcerptController,
  ],
  providers: [
    PagesService,
    RelatedService,
    NavigationService,
    LineService,
    SublineService,
    TractateRepository,
    MishnaRepository,
    RelatedRepository,
  ],
  exports: [PagesService, SublineService, TractateRepository, MishnaRepository],
})
export class PagesModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(UserMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'edit/*', method: RequestMethod.ALL });
  }
}
