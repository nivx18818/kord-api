import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';
import { createMockPrismaService, mockRole } from 'test/utils';

import { Permission } from '@/common/constants/permissions.enum';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { CreateRoleDto } from '@/modules/roles/dto/create-role.dto';
import { UpdateRoleDto } from '@/modules/roles/dto/update-role.dto';
import { RolesService } from '@/modules/roles/roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a role', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Admin',
        permissions: { kickUsers: true, manageChannels: true },
        serverId: 1,
      };

      const roleWithRelations = { ...mockRole, server: {}, users: [] };
      prisma.role.create.mockResolvedValue(roleWithRelations);

      const result = await service.create(createRoleDto);

      expect(result).toEqual(roleWithRelations);
      expect(prisma.role.create.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when server not found', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Admin',
        permissions: {},
        serverId: 999,
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2003',
        },
      );

      prisma.role.create.mockRejectedValue(prismaError);

      await expect(service.create(createRoleDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      const roles = [mockRole];
      prisma.role.findMany.mockResolvedValue(roles);

      const result = await service.findAll();

      expect(result).toEqual(roles);
      expect(prisma.role.findMany.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a role', async () => {
      prisma.role.findUnique.mockResolvedValue(mockRole);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRole);
      expect(prisma.role.findUnique.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updateRoleDto: UpdateRoleDto = {
        name: 'Updated Admin',
      };

      const updatedRole = {
        ...mockRole,
        name: 'Updated Admin',
      };
      prisma.role.update.mockResolvedValue(updatedRole);

      const result = await service.update(1, updateRoleDto);

      expect(result.name).toBe('Updated Admin');
      expect(prisma.role.update.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when role not found', async () => {
      const updateRoleDto: UpdateRoleDto = {};

      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.role.update.mockRejectedValue(prismaError);

      await expect(service.update(999, updateRoleDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a role', async () => {
      prisma.role.delete.mockResolvedValue(mockRole);

      const result = await service.remove(1);

      expect(result).toEqual(mockRole);
      expect(prisma.role.delete.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when role not found', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.role.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRolesToUser', () => {
    it('should assign multiple roles to a user', async () => {
      const userId = 1;
      const serverId = 1;
      const roleIds = [1, 2];

      prisma.membership.findUnique.mockResolvedValue({
        serverId,
        userId,
      } as never);

      prisma.role.findMany.mockResolvedValue([
        { id: 1, name: 'Admin', serverId: 1 },
        { id: 2, name: 'Moderator', serverId: 1 },
      ] as never);

      prisma.membershipRole.upsert.mockResolvedValue({} as never);
      prisma.$transaction.mockImplementation((fn: unknown) => fn as never);

      prisma.membershipRole.findMany.mockResolvedValue([
        { role: { id: 1, name: 'Admin' }, roleId: 1 },
        { role: { id: 2, name: 'Moderator' }, roleId: 2 },
      ] as never);

      const result = await service.assignRolesToUser(serverId, userId, roleIds);

      expect(result).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('checkServerPermissions', () => {
    it('should return true when server does not exist', async () => {
      prisma.server.findUnique.mockResolvedValue(null);

      const result = await service.checkServerPermissions(1, 999, [
        Permission.MANAGE_SERVERS,
      ]);

      expect(result).toBe(true);
    });

    it('should throw NotMemberOfServerException when user is not a member', async () => {
      prisma.server.findUnique.mockResolvedValue({ id: 1 } as never);
      prisma.membership.findUnique.mockResolvedValue(null);

      await expect(
        service.checkServerPermissions(1, 1, [Permission.MANAGE_SERVERS]),
      ).rejects.toThrow('User is not a member of this server');
    });

    it('should throw ForbiddenException when user has no role assigned', async () => {
      prisma.server.findUnique.mockResolvedValue({ id: 1 } as never);
      prisma.membership.findUnique.mockResolvedValue({
        roleId: null,
        serverId: 1,
        userId: 1,
      } as never);

      prisma.membershipRole.findMany.mockResolvedValue([]);

      await expect(
        service.checkServerPermissions(1, 1, [Permission.MANAGE_SERVERS]),
      ).rejects.toThrow('User has no roles assigned');
    });

    it('should throw MissingPermissionsException when user lacks required permissions', async () => {
      prisma.server.findUnique.mockResolvedValue({ id: 1 } as never);
      prisma.membership.findUnique.mockResolvedValue({
        roleId: 1,
        serverId: 1,
        userId: 1,
      } as never);

      prisma.membershipRole.findMany.mockResolvedValue([
        {
          role: {
            id: 1,
            permissions: { manageServers: false },
          },
        },
      ] as never);

      await expect(
        service.checkServerPermissions(1, 1, [Permission.MANAGE_SERVERS]),
      ).rejects.toThrow();
    });

    it('should aggregate permissions across multiple roles', async () => {
      const userId = 1;
      const serverId = 1;
      const requiredPermissions = [
        Permission.SEND_MESSAGES,
        Permission.MANAGE_CHANNELS,
      ];

      prisma.server.findUnique.mockResolvedValue({ id: 1 } as never);
      prisma.membership.findUnique.mockResolvedValue({
        serverId,
        userId,
      } as never);

      prisma.membershipRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: JSON.stringify({
              [Permission.SEND_MESSAGES]: true,
            }),
          },
        },
        {
          role: {
            permissions: JSON.stringify({
              [Permission.MANAGE_CHANNELS]: true,
            }),
          },
        },
      ] as never);

      const result = await service.checkServerPermissions(
        serverId,
        userId,
        requiredPermissions,
      );

      expect(result).toBe(true);
    });

    it('should return true when user has all required permissions', async () => {
      prisma.server.findUnique.mockResolvedValue({ id: 1 } as never);
      prisma.membership.findUnique.mockResolvedValue({
        roleId: 1,
        serverId: 1,
        userId: 1,
      } as never);

      prisma.membershipRole.findMany.mockResolvedValue([
        {
          role: {
            id: 1,
            permissions: {
              kickUsers: true,
              manageChannels: true,
              manageServers: true,
            },
          },
        },
      ] as never);

      const result = await service.checkServerPermissions(1, 1, [
        Permission.MANAGE_SERVERS,
        Permission.KICK_MEMBERS,
      ]);

      expect(result).toBe(true);
    });

    it('should handle JSON string permissions', async () => {
      prisma.server.findUnique.mockResolvedValue({ id: 1 } as never);
      prisma.membership.findUnique.mockResolvedValue({
        roleId: 1,
        serverId: 1,
        userId: 1,
      } as never);

      prisma.membershipRole.findMany.mockResolvedValue([
        {
          role: {
            id: 1,
            permissions: '{"manageServers": true}',
          },
        },
      ] as never);

      const result = await service.checkServerPermissions(1, 1, [
        Permission.MANAGE_SERVERS,
      ]);

      expect(result).toBe(true);
    });
  });
});
