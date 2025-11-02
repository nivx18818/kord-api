import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';

import { Permission } from '@/common/constants/permissions.enum';
import { RolesGuard } from '@/common/guards/roles.guard';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let prisma: PrismaService;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            channel: {
              findUnique: jest.fn(),
            },
            channelParticipant: {
              findUnique: jest.fn(),
            },
            membership: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    prisma = module.get<PrismaService>(PrismaService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no permissions are required', async () => {
      const mockContext = createMockExecutionContext();

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      const mockContext = createMockExecutionContext({
        user: undefined,
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.MANAGE_SERVERS]);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return true when user has required permissions', async () => {
      const mockContext = createMockExecutionContext({
        params: { serverId: '1' },
        user: { email: 'test@test.com', id: 1, username: 'testuser' },
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.MANAGE_SERVERS]);

      jest.spyOn(prisma.membership, 'findUnique').mockResolvedValue({
        createdAt: new Date(),
        role: {
          id: 1,
          name: 'Admin',
          permissions: {
            manageServers: true,
          },
          serverId: 1,
        },
        roleId: 1,
        serverId: 1,
        updatedAt: new Date(),
        userId: 1,
      } as never);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user lacks required permissions', async () => {
      const mockContext = createMockExecutionContext({
        params: { serverId: '1' },
        user: { email: 'test@test.com', id: 1, username: 'testuser' },
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.MANAGE_SERVERS]);

      jest.spyOn(prisma.membership, 'findUnique').mockResolvedValue({
        createdAt: new Date(),
        role: {
          id: 1,
          name: 'Member',
          permissions: {
            manageServers: false,
          },
          serverId: 1,
        },
        roleId: 1,
        serverId: 1,
        updatedAt: new Date(),
        userId: 1,
      } as never);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user is not a member', async () => {
      const mockContext = createMockExecutionContext({
        params: { serverId: '1' },
        user: { email: 'test@test.com', id: 1, username: 'testuser' },
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.MANAGE_SERVERS]);

      jest.spyOn(prisma.membership, 'findUnique').mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow DM participants to access DM channels', async () => {
      const mockContext = createMockExecutionContext({
        body: { channelId: '1' },
        user: { email: 'test@test.com', id: 1, username: 'testuser' },
      });

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Permission.SEND_MESSAGES]);

      jest.spyOn(prisma.channel, 'findUnique').mockResolvedValue({
        createdAt: new Date(),
        id: 1,
        isDM: true,
        name: 'DM',
        serverId: 1,
        status: 'PUBLIC',
        type: 'TEXT',
        updatedAt: new Date(),
      });

      jest.spyOn(prisma.channelParticipant, 'findUnique').mockResolvedValue({
        channelId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });
});

function createMockExecutionContext(options?: {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  route?: { path?: string };
  url?: string;
  user?: { email: string; id: number; username: string };
}): ExecutionContext {
  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        body: options?.body || {},
        params: options?.params || {},
        route: options?.route || {},
        url: options?.url || '',
        user: options?.user || {
          email: 'test@test.com',
          id: 1,
          username: 'testuser',
        },
      }),
    }),
  } as unknown as ExecutionContext;
}
