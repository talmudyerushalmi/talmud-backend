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
import { SettingsModule } from '../settings/settings.module';
import { TractatesController } from './tractates/tractates.controller';
import { SublineService } from './subline.service';
import { EditorMiddleware, AuthenticatedMiddleware } from '../middleware/auth';
import { NavigationtController } from './navigation.controller';
import { NavigationService } from './navigation.service';
import { RelatedController } from './related.controller';
import { RelatedService } from './related.service';
import { Related } from './models/related.model';
import { RelatedSchema } from './schemas/related.schema';
import { RelatedRepository } from './related.repository';
import { ManuscriptsController } from './manuscripts.controller';
import { Manuscripts, ManuscriptSchema } from './schemas/manuscripts.schema';
import { ManuscriptsRepository } from './manuscripts.repository';
import { ManuscriptsService } from './manuscripts.service';
import { ParallelService } from './parallel.service';
import { User, UserSchema } from './schemas/users.schema';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { UsersRepository } from './users/users.repository';
import { ActionsMishnaController } from './actions.mishna.controller';
import { SynopsisService } from './synopsis.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tractate.name, schema: TractateSchema },
      { name: Mishna.name, schema: MishnaSchema },
      { name: Related.name, schema: RelatedSchema },
      { name: Manuscripts.name, schema: ManuscriptSchema },
      { name: User.name, schema: UserSchema },
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
    ActionsMishnaController,
    EditMishnaExcerptController,
    ManuscriptsController,
    UsersController,
  ],
  providers: [
    PagesService,
    RelatedService,
    NavigationService,
    ParallelService,
    SublineService,
    ManuscriptsService,
    UsersService,
    SynopsisService,
    TractateRepository,
    MishnaRepository,
    RelatedRepository,
    ManuscriptsRepository,
    UsersRepository,
  ],
  exports: [
    PagesService,
    SublineService,
    SynopsisService,
    TractateRepository,
    MishnaRepository,
  ],
})
export class PagesModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(EditorMiddleware)
      .forRoutes(
        { path: 'edit/*', method: RequestMethod.ALL },
        { path: 'users/comments/moderation*', method: RequestMethod.ALL },
      );
    consumer
      .apply(AuthenticatedMiddleware)
      .forRoutes({ path: 'users/comments*', method: RequestMethod.ALL });
  }
}
