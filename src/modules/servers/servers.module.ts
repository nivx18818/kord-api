import { Module } from '@nestjs/common';

import { RolesModule } from '../roles/roles.module';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  controllers: [ServersController],
  imports: [RolesModule],
  providers: [ServersService],
})
export class ServersModule {}
