import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ChannelStatus, ChannelType } from 'generated/prisma/enums';

export class CreateChannelDto {
  @IsString()
  name: string;

  @ValidateIf((o: CreateChannelDto) => !o.isDM)
  @IsInt()
  serverId?: number;

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
