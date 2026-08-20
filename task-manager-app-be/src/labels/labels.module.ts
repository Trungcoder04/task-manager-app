import { Module } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelsController } from './labels.controller';
import { AuthModule } from '../auth/auth.module'; // Để dùng được AuthGuard
@Module({
  controllers: [LabelsController],
  providers: [LabelsService],
  imports: [AuthModule],
})
export class LabelsModule {}
