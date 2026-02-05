import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Permission } from '@/common/constants/permissions.enum';
import { RequiredPermissions } from '@/common/decorators/required-permissions.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import {
  CurrentUser,
  type RequestUser,
} from '../auth/decorators/current-user.decorator';
import { ChannelsService } from './channels.service';
import { AddParticipantDto } from './dto/add-participant.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { FindOrCreateDMDto } from './dto/find-or-create-dm.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @RequiredPermissions(Permission.MANAGE_CHANNELS)
  create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.create(createChannelDto);
  }

  @Get()
  findAll() {
    return this.channelsService.findAll();
  }

  @Get(':channelId')
  @RequiredPermissions(Permission.VIEW_CHANNELS)
  findOne(@Param('channelId') channelId: string) {
    return this.channelsService.findOne(+channelId);
  }

  @Post('dm')
  findOrCreateDM(
    @Body() findOrCreateDMDto: FindOrCreateDMDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.channelsService.findOrCreateDM(
      user.id,
      findOrCreateDMDto.otherParticipantIds,
    );
  }

  @Get('dms')
  getUserDMs(@CurrentUser() user: RequestUser) {
    return this.channelsService.getUserDMs(user.id);
  }

  @Patch(':channelId')
  @RequiredPermissions(Permission.MANAGE_CHANNELS)
  update(
    @Param('channelId') channelId: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelsService.update(+channelId, updateChannelDto);
  }

  @Delete(':channelId')
  @RequiredPermissions(Permission.MANAGE_CHANNELS)
  remove(@Param('channelId') channelId: string) {
    return this.channelsService.remove(+channelId);
  }

  @Delete(':channelId/participants/:userId')
  @RequiredPermissions(Permission.MANAGE_CHANNELS)
  removeParticipant(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string,
  ) {
    return this.channelsService.removeParticipant(+channelId, +userId);
  }

  @Post(':channelId/participants')
  @RequiredPermissions(Permission.MANAGE_CHANNELS)
  addParticipant(
    @Param('channelId') channelId: string,
    @Body() addParticipantDto: AddParticipantDto,
  ) {
    return this.channelsService.addParticipant(
      +channelId,
      addParticipantDto.userId,
    );
  }

  @Post(':channelId/block')
  blockDM(
    @Param('channelId') channelId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.channelsService.blockDM(+channelId, user.id);
  }

  @Delete(':channelId/block')
  unblockDM(
    @Param('channelId') channelId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.channelsService.unblockDM(+channelId, user.id);
  }
}
