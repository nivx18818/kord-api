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
import { BlockChannelDto } from './dto/block-channel.dto';
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
  blockChannel(
    @Param('id') id: string,
    @Body() blockChannelDto: BlockChannelDto,
  ) {
    return this.channelsService.blockChannel(
      blockChannelDto.userId,
      +id,
      blockChannelDto.reason,
    );
  }

  @Delete(':id/block/:userId')
  unblockChannel(@Param('id') id: string, @Param('userId') userId: string) {
    return this.channelsService.unblockChannel(+userId, +id);
  }
}
