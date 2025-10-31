import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

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
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Get(':id/servers')
  findUserServers(@Param('id') id: string) {
    return this.usersService.findUserServers(+id);
  }

  @Get(':id/muted')
  getMutedUsers(@Param('id') id: string) {
    return this.usersService.getMutedUsers(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post(':id/mute')
  muteUser(@Param('id') id: string, @Body() muteUserDto: MuteUserDto) {
    return this.usersService.muteUser(
      +id,
      muteUserDto.targetId,
      muteUserDto.reason,
    );
  }

  @Delete(':id/mute/:targetId')
  unmuteUser(@Param('id') id: string, @Param('targetId') targetId: string) {
    return this.usersService.unmuteUser(+id, +targetId);
  }
}
