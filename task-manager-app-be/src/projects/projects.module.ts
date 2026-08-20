import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  imports: [AuthModule],
})
export class ProjectsModule {}
