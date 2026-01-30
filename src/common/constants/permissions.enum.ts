/* eslint-disable perfectionist/sort-enums */
export enum Permission {
  // Reaction Permissions
  ADD_REACTIONS = 'addReactions',

  // Member Management
  BAN_MEMBERS = 'banMembers',
  KICK_MEMBERS = 'kickMembers',

  // Voice Permissions
  CONNECT_VOICE = 'connectVoice',
  DEAFEN_MEMBERS = 'deafenMembers',
  MUTE_MEMBERS = 'muteMembers',

  // Channel Permissions
  DELETE_MESSAGES = 'deleteMessages',
  EDIT_MESSAGES = 'editMessages',
  SEND_MESSAGES = 'sendMessages',
  SPEAK_VOICE = 'speakVoice',
  VIEW_CHANNELS = 'viewChannels',

  // Server Permissions
  VIEW_ROLES = 'viewRoles',

  // Server Management
  MANAGE_CHANNELS = 'manageChannels',
  MANAGE_INVITES = 'manageInvites',
  MANAGE_REACTIONS = 'manageReactions',
  MANAGE_ROLES = 'manageRoles',
  MANAGE_SERVERS = 'manageServers',
}

export type PermissionsMap = Partial<Record<Permission, boolean>>;
