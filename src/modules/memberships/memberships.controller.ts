import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipsService } from './memberships.service';

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  create(@Body() createMembershipDto: CreateMembershipDto) {
    return this.membershipsService.create(createMembershipDto);
  }

  @Get()
  findAll() {
    return this.membershipsService.findAll();
  }

  @Get(':userId/:serverId')
  findOne(
    @Param('userId') userId: string,
    @Param('serverId') serverId: string,
  ) {
    return this.membershipsService.findOne(+userId, +serverId);
  }

  @Patch(':userId/:serverId')
  update(
    @Param('userId') userId: string,
    @Param('serverId') serverId: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return this.membershipsService.update(
      +userId,
      +serverId,
      updateMembershipDto,
    );
  }

  @Delete(':userId/:serverId')
  remove(@Param('userId') userId: string, @Param('serverId') serverId: string) {
    return this.membershipsService.remove(+userId, +serverId);
  }
}
