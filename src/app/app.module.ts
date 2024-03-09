import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendJwtUtilsModule } from '@ubs-platform/users-mona-microservice-helper';

@Module({
  imports: [BackendJwtUtilsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
