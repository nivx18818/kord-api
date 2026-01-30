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
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  findAll(@Query('serverId') serverId?: string) {
    return this.rolesService.findAll(serverId ? +serverId : undefined);
  }

  @Get(':roleId')
  findOne(@Param('roleId') roleId: string) {
    return this.rolesService.findOne(+roleId);
  }

  @Get('users/:userId/servers/:serverId')
  @RequiredPermissions(Permission.VIEW_ROLES)
  getUserRoles(
    @Param('userId') userId: string,
    @Param('serverId') serverId: string,
  ) {
    return this.rolesService.getUserRoles(+userId, +serverId);
  }

  @Patch(':roleId')
  update(
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(+roleId, updateRoleDto);
  }

  @Delete(':roleId')
  remove(@Param('roleId') roleId: string) {
    return this.rolesService.remove(+roleId);
  }
}
