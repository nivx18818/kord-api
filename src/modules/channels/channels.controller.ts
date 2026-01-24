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

import { ChannelsService } from './channels.service';
import { AddParticipantDto } from './dto/add-participant.dto';
import { BlockDMDto } from './dto/block-dm.dto';
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
  findOrCreateDM(@Body() findOrCreateDMDto: FindOrCreateDMDto) {
    return this.channelsService.findOrCreateDM(
      findOrCreateDMDto.user1Id,
      findOrCreateDMDto.user2Id,
      findOrCreateDMDto.serverId,
    );
  }

  @Get('user/:userId/dms')
  getUserDMs(@Param('userId') userId: string) {
    return this.channelsService.getUserDMs(+userId);
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
  removeParticipant(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string,
  ) {
    return this.channelsService.removeParticipant(+channelId, +userId);
  }

  @Post(':channelId/participants')
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
    @Body() blockDMDto: BlockDMDto,
  ) {
    return this.channelsService.blockDM(blockDMDto.userId, +channelId);
  }

  @Delete(':channelId/block/:userId')
  unblockDM(
    @Param('channelId') channelId: string,
    @Param('userId') userId: string,
  ) {
    return this.channelsService.unblockDM(+userId, +channelId);
  }
}
