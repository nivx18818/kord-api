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
    @Query('channelId') channelId?: string,
    @Query() pagination?: MessagePaginationDto,
  ) {
    return this.messagesService.findAll(
      channelId ? +channelId : undefined,
      pagination,
    );
  }

  @Get(':id')
  @RequiredPermissions(Permission.VIEW_CHANNELS)
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(+id);
  }

  @Patch(':id')
  @RequiredPermissions(Permission.EDIT_MESSAGES)
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.messagesService.update(+id, updateMessageDto, user.id);
  }

  @Delete(':id')
  // Users can delete their own messages
  // Service layer enforces ownership check
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.messagesService.remove(+id, user.id);
  }
}
