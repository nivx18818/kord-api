import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export interface CursorPaginatedResponse<T> {
  after?: string;
  before?: string;
  hasMore: boolean;
  items: T[];
  limit: number;
}

export interface OffsetPaginatedResponse<T> {
  hasMore: boolean;
  items: T[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  after?: string;

  @IsOptional()
  @IsString()
  before?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;
}

export class MessagePaginationDto extends CursorPaginationDto {
  @IsInt()
  @Type(() => Number)
  channelId!: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ValidateIf((o: MessagePaginationDto) => o.parentMessageId !== undefined)
  parentMessageId?: number;
}

/**
 * Query parameters for offset-based pagination
 * Used for static or slowly-changing lists
 */
export class OffsetPaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;
}

export class SearchPaginationDto extends OffsetPaginationDto {
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;
}

export function buildCursorPaginatedResponse<T>(
  items: T[],
  limit: number,
  hasMore: boolean,
  before?: string,
  after?: string,
): CursorPaginatedResponse<T> {
  return {
    after,
    before,
    hasMore,
    items,
    limit,
  };
}

export function buildOffsetPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): OffsetPaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    hasMore,
    items,
    limit,
    page,
    total,
    totalPages,
  };
}
