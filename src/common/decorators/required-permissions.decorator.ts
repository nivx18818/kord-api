import { SetMetadata } from '@nestjs/common';

import { Permission } from '../constants/permissions.enum';

export const PERMISSIONS_KEY = 'permissions';

export const RequiredPermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
