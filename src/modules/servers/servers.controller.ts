import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import {
  CurrentUser,
  type RequestUser,
} from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import { AssignRolesDto } from '../roles/dto/assign-roles.dto';
import { RemoveRolesDto } from '../roles/dto/remove-roles.dto';
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
  create(
    @Body() createServerDto: CreateServerDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.serversService.create(createServerDto, user.id);
  }

  @Post(':serverId/invites')
  @RequiredPermissions(Permission.MANAGE_INVITES)
  createInvite(
    @Param('serverId') serverId: string,
    @Body() createInviteDto: CreateInviteDto,
  ) {
    return this.serversService.createInvite(
      +serverId,
      createInviteDto.createdBy,
      createInviteDto.expiresInDays,
    );
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    if (userId) {
      return this.serversService.findByUserId(+userId);
    }
    const pagination: OffsetPaginationDto = {
      limit: limit ? parseInt(limit, 10) : 10,
      page: page ? parseInt(page, 10) : 1,
    };
    return this.serversService.findAll(pagination);
  }

  @Get(':serverId')
  @RequiredPermissions(Permission.VIEW_CHANNELS)
  findOne(@Param('serverId') serverId: string) {
    return this.serversService.findOne(+serverId);
  }

  @Get(':serverId/invites')
  @RequiredPermissions(Permission.MANAGE_INVITES)
  getServerInvites(@Param('serverId') serverId: string) {
    return this.serversService.getServerInvites(+serverId);
  }

  @Patch(':serverId')
  @RequiredPermissions(Permission.MANAGE_SERVERS)
  update(
    @Param('serverId') serverId: string,
    @Body() updateServerDto: UpdateServerDto,
  ) {
    return this.serversService.update(+serverId, updateServerDto);
  }

  @Delete(':serverId/invites/:code')
  @RequiredPermissions(Permission.MANAGE_INVITES)
  deleteInvite(
    @Param('serverId') serverId: string,
    @Param('code') code: string,
  ) {
    return this.serversService.deleteInvite(code, +serverId);
  }

  @Delete(':serverId')
  @RequiredPermissions(Permission.MANAGE_SERVERS)
  remove(@Param('serverId') serverId: string) {
    return this.serversService.remove(+serverId);
  }

  @Delete(':serverId/members/:userId/roles/all')
  @RequiredPermissions(Permission.MANAGE_ROLES)
  removeAllRoles(
    @Param('serverId') serverId: string,
    @Param('userId') userId: string,
  ) {
    return this.serversService.removeAllRoles(+serverId, +userId);
  }

  @Delete(':serverId/members/:userId/roles')
  @RequiredPermissions(Permission.MANAGE_ROLES)
  removeRoles(
    @Param('serverId') serverId: string,
    @Param('userId') userId: string,
    @Body() removeRolesDto: RemoveRolesDto,
  ) {
    return this.serversService.removeRoles(
      +serverId,
      +userId,
      removeRolesDto.roleIds,
    );
  }

  @Post(':serverId/members/:userId/roles')
  @HttpCode(HttpStatus.OK)
  @RequiredPermissions(Permission.MANAGE_ROLES)
  assignRoles(
    @Param('serverId') serverId: string,
    @Param('userId') userId: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.serversService.assignRoles(
      +serverId,
      +userId,
      assignRolesDto.roleIds,
    );
  }

  @Post('invites/:code/redeem')
  redeemInvite(
    @Param('code') code: string,
    @Body() redeemInviteDto: RedeemInviteDto,
  ) {
    return this.serversService.redeemInvite(code, redeemInviteDto.userId);
  }
}
