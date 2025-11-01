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

import { OffsetPaginationDto } from '@/common/dto/pagination.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import { CreateUserDto } from './dto/create-user.dto';
import { MuteUserDto } from './dto/mute-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() pagination: OffsetPaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Get(':id/servers')
  findUserServers(@Param('id') id: string) {
    return this.usersService.findUserServers(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/muted')
  getMutedUsers(@Param('id') id: string) {
    return this.usersService.getMutedUsers(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/mute')
  muteUser(@Param('id') id: string, @Body() muteUserDto: MuteUserDto) {
    return this.usersService.muteUser(
      +id,
      muteUserDto.targetId,
      muteUserDto.reason,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/mute/:targetId')
  unmuteUser(@Param('id') id: string, @Param('targetId') targetId: string) {
    return this.usersService.unmuteUser(+id, +targetId);
  }
}
