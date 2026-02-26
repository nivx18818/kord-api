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
import { MessagePaginationDto } from '@/common/dto/pagination.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import {
  CurrentUser,
  type RequestUser,
} from '@/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @RequiredPermissions(Permission.SEND_MESSAGES)
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  @Get()
  @RequiredPermissions(Permission.VIEW_CHANNELS)
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('channelId') channelId?: string,
    @Query() pagination?: MessagePaginationDto,
  ) {
    return this.messagesService.findAll(
      user.id,
      channelId ? +channelId : undefined,
      pagination,
    );
  }

  @Get(':messageId')
  @RequiredPermissions(Permission.VIEW_CHANNELS)
  findOne(@Param('messageId') messageId: string) {
    return this.messagesService.findOne(+messageId);
  }

  @Patch(':messageId')
  update(
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.messagesService.update(+messageId, updateMessageDto, user.id);
  }

  @Delete(':messageId')
  remove(
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.messagesService.remove(+messageId, user.id);
  }
}
