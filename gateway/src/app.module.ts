import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [HttpModule],
  controllers: [ProxyController, DashboardController],
})
export class AppModule {}
