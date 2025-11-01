import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ChannelsService } from './channels.service';
import { BlockDMDto } from './dto/block-dm.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { FindOrCreateDMDto } from './dto/find-or-create-dm.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channels')
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    return this.channelsService.update(+id, updateChannelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.channelsService.remove(+id);
  }

  @Post(':id/block')
  blockDM(@Param('id') id: string, @Body() blockDMDto: BlockDMDto) {
    return this.channelsService.blockDM(
      blockDMDto.userId,
      +id,
      blockDMDto.reason,
    );
  }

  @Delete(':id/block/:userId')
  unblockDM(@Param('id') id: string, @Param('userId') userId: string) {
    return this.channelsService.unblockDM(+userId, +id);
  }
}
