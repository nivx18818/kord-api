import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
} from 'class-validator';

export class FindOrCreateDMDto {
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least 1 other participant required for a DM',
  })
  @ArrayMaxSize(9, {
    message:
      'Group DMs support a maximum of 9 other participants (10 total including you)',
  })
  @ArrayUnique({ message: 'Participant IDs must be unique' })
  @IsInt({ each: true })
  otherParticipantIds: number[];
}
