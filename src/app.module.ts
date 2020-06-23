import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule} from '@nestjs/typeorm';
import { Page } from './pages/page.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: 'mongodb://localhost/talmud',
      synchronize: true,
      useUnifiedTopology: true,
      entities: [
        Page
      ]
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
