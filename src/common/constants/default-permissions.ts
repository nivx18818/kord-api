import { Permission, PermissionsMap } from './permissions.enum';

export const DEFAULT_ADMIN_PERMISSIONS: PermissionsMap = {
  [Permission.ADD_REACTIONS]: true,
  [Permission.BAN_MEMBERS]: true,
  [Permission.CONNECT_VOICE]: true,
  [Permission.DEAFEN_MEMBERS]: true,
  [Permission.DELETE_MESSAGES]: true,
  [Permission.EDIT_MESSAGES]: true,
  [Permission.KICK_MEMBERS]: true,
  [Permission.MANAGE_CHANNELS]: true,
  [Permission.MANAGE_INVITES]: true,
  [Permission.MANAGE_REACTIONS]: true,
  [Permission.MANAGE_ROLES]: true,
  [Permission.MANAGE_SERVERS]: true,
  [Permission.MUTE_MEMBERS]: true,
  [Permission.SEND_MESSAGES]: true,
  [Permission.SPEAK_VOICE]: true,
  [Permission.VIEW_CHANNELS]: true,
};

export const DEFAULT_MEMBER_PERMISSIONS: PermissionsMap = {
  [Permission.ADD_REACTIONS]: true,
  [Permission.CONNECT_VOICE]: true,
  [Permission.SEND_MESSAGES]: true,
  [Permission.SPEAK_VOICE]: true,
  [Permission.VIEW_CHANNELS]: true,
};
