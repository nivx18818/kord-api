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

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import { ChannelsService } from './channels.service';
import { AddParticipantDto } from './dto/add-participant.dto';
import { BlockDMDto } from './dto/block-dm.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { FindOrCreateDMDto } from './dto/find-or-create-dm.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.create(createChannelDto);
  }

  @Get()
  findAll() {
    return this.channelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(+id);
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    return this.channelsService.update(+id, updateChannelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.channelsService.remove(+id);
  }

  @Delete(':id/participants/:userId')
  removeParticipant(@Param('id') id: string, @Param('userId') userId: string) {
    return this.channelsService.removeParticipant(+id, +userId);
  }

  @Post(':id/participants')
  addParticipant(
    @Param('id') id: string,
    @Body() addParticipantDto: AddParticipantDto,
  ) {
    return this.channelsService.addParticipant(+id, addParticipantDto.userId);
  }

  @Post(':id/block')
  blockDM(@Param('id') id: string, @Body() blockDMDto: BlockDMDto) {
    return this.channelsService.blockDM(blockDMDto.userId, +id);
  }

  @Delete(':id/block/:userId')
  unblockDM(@Param('id') id: string, @Param('userId') userId: string) {
    return this.channelsService.unblockDM(+userId, +id);
  }
}
