import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateReactionDto } from './dto/create-reaction.dto';
import { UpdateReactionDto } from './dto/update-reaction.dto';
import { ReactionsService } from './reactions.service';

@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  create(@Body() createReactionDto: CreateReactionDto) {
    return this.reactionsService.create(createReactionDto);
  }

  @Get()
  findAll() {
    return this.reactionsService.findAll();
  }

  @Get(':messageId/:userId')
  findOne(
    @Param('messageId') messageId: string,
    @Param('userId') userId: string,
  ) {
    return this.reactionsService.findOne(+messageId, +userId);
  }

  @Patch(':messageId/:userId')
  update(
    @Param('messageId') messageId: string,
    @Param('userId') userId: string,
    @Body() updateReactionDto: UpdateReactionDto,
  ) {
    return this.reactionsService.update(+messageId, +userId, updateReactionDto);
  }

  @Delete(':messageId/:userId')
  remove(
    @Param('messageId') messageId: string,
    @Param('userId') userId: string,
  ) {
    return this.reactionsService.remove(+messageId, +userId);
  }
}
