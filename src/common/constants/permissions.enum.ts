export enum Permission {
  // Reaction Permissions
  ADD_REACTIONS = 'addReactions',

  // Member Management
  BAN_MEMBERS = 'banMembers',

  // Voice Permissions
  CONNECT_VOICE = 'connectVoice',
  DEAFEN_MEMBERS = 'deafenMembers',

  // Channel Permissions
  DELETE_MESSAGES = 'deleteMessages',
  EDIT_MESSAGES = 'editMessages',

  // Member Management
  KICK_MEMBERS = 'kickMembers',

  // Server Management
  MANAGE_CHANNELS = 'manageChannels',
  MANAGE_INVITES = 'manageInvites',
  MANAGE_REACTIONS = 'manageReactions',
  MANAGE_ROLES = 'manageRoles',
  MANAGE_SERVERS = 'manageServers',

  // Voice Permissions
  MUTE_MEMBERS = 'muteMembers',

  // Channel Permissions
  SEND_MESSAGES = 'sendMessages',
  SPEAK_VOICE = 'speakVoice',
  VIEW_CHANNELS = 'viewChannels',
}

export type PermissionsMap = Partial<Record<Permission, boolean>>;
