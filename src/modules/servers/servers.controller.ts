import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { OffsetPaginationDto } from '@/common/dto/pagination.dto';

import { CreateInviteDto } from './dto/create-invite.dto';
import { CreateServerDto } from './dto/create-server.dto';
import { RedeemInviteDto } from './dto/redeem-invite.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { ServersService } from './servers.service';

@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  create(@Body() createServerDto: CreateServerDto) {
    return this.serversService.create(createServerDto);
  }

  @Post(':id/invites')
  createInvite(
    @Param('id') id: string,
    @Body() createInviteDto: CreateInviteDto,
  ) {
    return this.serversService.createInvite(
      +id,
      createInviteDto.createdBy,
      createInviteDto.expiresInDays,
    );
  }

  @Get()
  findAll(
    @Query() pagination: OffsetPaginationDto,
    @Query('userId') userId?: string,
  ) {
    if (userId) {
      return this.serversService.findByUserId(+userId);
    }
    return this.serversService.findAll(pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serversService.findOne(+id);
  }

  @Get(':id/invites')
  getServerInvites(@Param('id') id: string) {
    return this.serversService.getServerInvites(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServerDto: UpdateServerDto) {
    return this.serversService.update(+id, updateServerDto);
  }

  @Delete(':id/invites/:code')
  deleteInvite(@Param('id') id: string, @Param('code') code: string) {
    return this.serversService.deleteInvite(code, +id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serversService.remove(+id);
  }

  @Post('invites/:code/redeem')
  redeemInvite(
    @Param('code') code: string,
    @Body() redeemInviteDto: RedeemInviteDto,
  ) {
    return this.serversService.redeemInvite(code, redeemInviteDto.userId);
  }
}
