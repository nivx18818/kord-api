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

import {
  CurrentUser,
  type RequestUser,
} from '../auth/decorators/current-user.decorator';
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
  @Get('me/blocks')
  getBlockedUsers(@CurrentUser() user: RequestUser) {
    return this.usersService.getBlockedUsers(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/muted')
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
  @Post('me/blocks/:targetId')
  blockUser(
    @Param('targetId') targetId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.blockUser(user.id, +targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/mute/:targetId')
  muteUser(
    @Param('targetId') targetId: string,
    @Body() muteUserDto: MuteUserDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.muteUser(user.id, +targetId, muteUserDto.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/blocks/:targetId')
  unblockUser(
    @Param('targetId') targetId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.unblockUser(user.id, +targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/mute/:targetId')
  unmuteUser(
    @Param('targetId') targetId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.unmuteUser(user.id, +targetId);
  }
}
