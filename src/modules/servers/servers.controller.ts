import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Permission } from '@/common/constants/permissions.enum';
import { RequiredPermissions } from '@/common/decorators/required-permissions.decorator';
import { OffsetPaginationDto } from '@/common/dto/pagination.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import { CreateInviteDto } from './dto/create-invite.dto';
import { CreateServerDto } from './dto/create-server.dto';
import { RedeemInviteDto } from './dto/redeem-invite.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServersService } from './servers.service';

@Controller('servers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  @RequiredPermissions(Permission.MANAGE_SERVERS)
  create(@Body() createServerDto: CreateServerDto) {
    return this.serversService.create(createServerDto);
  }

  @Post(':id/invites')
  @RequiredPermissions(Permission.MANAGE_INVITES)
  createInvite(
    @Param('id') id: string,
    @Body() createInviteDto: CreateInviteDto,
  ) {
    return this.serversService.createInvite(
      +id,
      createInviteDto.createdBy,
      createInviteDto.expiresInDays,
    );
  }

  @Get()
  findAll(
    @Query() pagination: OffsetPaginationDto,
    @Query('userId') userId?: string,
  ) {
    if (userId) {
      return this.serversService.findByUserId(+userId);
    }
    return this.serversService.findAll(pagination);
  }

  @Get(':id')
  @RequiredPermissions(Permission.VIEW_CHANNELS)
  findOne(@Param('id') id: string) {
    return this.serversService.findOne(+id);
  }

  @Get(':id/invites')
  @RequiredPermissions(Permission.MANAGE_INVITES)
  getServerInvites(@Param('id') id: string) {
    return this.serversService.getServerInvites(+id);
  }

  @Patch(':id')
  @RequiredPermissions(Permission.MANAGE_SERVERS)
  update(@Param('id') id: string, @Body() updateServerDto: UpdateServerDto) {
    return this.serversService.update(+id, updateServerDto);
  }

  @Delete(':id/invites/:code')
  @RequiredPermissions(Permission.MANAGE_INVITES)
  deleteInvite(@Param('id') id: string, @Param('code') code: string) {
    return this.serversService.deleteInvite(code, +id);
  }

  @Delete(':id')
  @RequiredPermissions(Permission.MANAGE_SERVERS)
  remove(@Param('id') id: string) {
    return this.serversService.remove(+id);
  }

  @Delete(':id/members/:userId/roles')
  @RequiredPermissions(Permission.MANAGE_ROLES)
  removeRole(@Param('id') serverId: string, @Param('userId') userId: string) {
    return this.serversService.removeRole(+serverId, +userId);
  }

  @Post(':id/members/:userId/roles/:roleId')
  @RequiredPermissions(Permission.MANAGE_ROLES)
  assignRole(
    @Param('id') serverId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.serversService.assignRole(+serverId, +userId, +roleId);
  }

  @Post('invites/:code/redeem')
  redeemInvite(
    @Param('code') code: string,
    @Body() redeemInviteDto: RedeemInviteDto,
  ) {
    return this.serversService.redeemInvite(code, redeemInviteDto.userId);
  }
}
