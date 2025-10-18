import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChannelStatus, ChannelType } from 'generated/prisma';

export class CreateChannelDto {
  @IsString()
  name: string;

  @IsInt()
  serverId: number;

  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @IsOptional()
  @IsEnum(ChannelStatus)
  status?: ChannelStatus;

  @IsOptional()
  @IsBoolean()
  isDM?: boolean;
}
