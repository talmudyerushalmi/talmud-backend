import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CsvParser } from 'nest-csv-parser';
import { ConsoleModule } from 'nestjs-console';
import { Settings, SettingsSchema } from './schemas/settings.schema';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { UserMiddleware } from '../middleware/userType';
import { EditorMiddleware } from '../middleware/auth';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),
    ConsoleModule,
    CsvParser,
  ],
  providers: [SettingsService, CsvParser],
  exports: [SettingsService],
  controllers: [SettingsController],
})
export class SettingsModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(UserMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer
      .apply(EditorMiddleware)
      .forRoutes({ path: '*/add', method: RequestMethod.ALL });
  }
}
