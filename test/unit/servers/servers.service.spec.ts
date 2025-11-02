/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import {
  createMockPrismaService,
  createMockServerWithRelations,
  mockServer,
} from 'test/utils';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { RolesService } from '@/modules/roles/roles.service';
import { CreateServerDto } from '@/modules/servers/dto/create-server.dto';
import { UpdateServerDto } from '@/modules/servers/dto/update-server.dto';
import { ServersService } from '@/modules/servers/servers.service';

describe('ServersService', () => {
  let service: ServersService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  const mockRolesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByServerAndUser: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    service = module.get<ServersService>(ServersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a server with admin role and membership', async () => {
      const createServerDto: CreateServerDto = {
        name: 'Test Server',
        servername: 'testserver',
      };
      const creatorId = 1;

      const serverWithRelations = createMockServerWithRelations();
      const mockAdminRole = {
        id: 1,
        name: 'Admin',
        permissions: {},
        serverId: mockServer.id,
      };
      const mockMembership = {
        roleId: 1,
        serverId: mockServer.id,
        userId: creatorId,
      };

      // Mock transaction callback
      // eslint-disable-next-line @typescript-eslint/require-await
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          membership: {
            create: jest.fn().mockResolvedValue(mockMembership),
          },
          role: {
            create: jest.fn().mockResolvedValue(mockAdminRole),
          },
          server: {
            create: jest.fn().mockResolvedValue(mockServer),
            findUnique: jest.fn().mockResolvedValue(serverWithRelations),
          },
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return callback(mockTx);
      });

      const result = await service.create(createServerDto, creatorId);

      expect(result).toEqual(serverWithRelations);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException when servername already exists', async () => {
      const createServerDto: CreateServerDto = {
        name: 'Test Server',
        servername: 'testserver',
      };
      const creatorId = 1;

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
          meta: { target: ['servername'] },
        },
      );

      prisma.$transaction.mockRejectedValue(prismaError);

      await expect(service.create(createServerDto, creatorId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createServerDto, creatorId)).rejects.toThrow(
        'Servername already taken',
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of servers with relations', async () => {
      const servers = [createMockServerWithRelations()];
      prisma.server.findMany.mockResolvedValue(servers);
      prisma.server.count.mockResolvedValue(servers.length);

      const result = await service.findAll();

      expect(result).toEqual({
        hasMore: false,
        items: servers,
        limit: 10,
        page: 1,
        total: servers.length,
        totalPages: 1,
      });
      expect(prisma.server.findMany.mock.calls.length).toBeGreaterThan(0);
      expect(prisma.server.count.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a server with relations', async () => {
      const server = createMockServerWithRelations();
      prisma.server.findUnique.mockResolvedValue(server);

      const result = await service.findOne(1);

      expect(result).toEqual(server);
      expect(prisma.server.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
    });

    it('should throw NotFoundException when server not found', async () => {
      prisma.server.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Server not found');
    });
  });

  describe('update', () => {
    it('should update a server', async () => {
      const updateServerDto: UpdateServerDto = {
        name: 'Updated Server',
      };

      const updatedServer = {
        ...createMockServerWithRelations(),
        name: 'Updated Server',
      };
      prisma.server.update.mockResolvedValue(updatedServer);

      const result = await service.update(1, updateServerDto);

      expect(result.name).toBe('Updated Server');
      expect(prisma.server.update.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when server not found', async () => {
      const updateServerDto: UpdateServerDto = {
        name: 'Updated Server',
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.server.update.mockRejectedValue(prismaError);

      await expect(service.update(999, updateServerDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when updating to existing servername', async () => {
      const updateServerDto: UpdateServerDto = {
        servername: 'existing',
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
          meta: { target: ['servername'] },
        },
      );

      prisma.server.update.mockRejectedValue(prismaError);

      await expect(service.update(1, updateServerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a server', async () => {
      prisma.server.delete.mockResolvedValue(mockServer);

      const result = await service.remove(1);

      expect(result).toEqual(mockServer);
      expect(prisma.server.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
    });

    it('should throw NotFoundException when server not found', async () => {
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        {
          clientVersion: '5.0.0',
          code: 'P2025',
        },
      );

      prisma.server.delete.mockRejectedValue(prismaError);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('redeemInvite', () => {
    it('should redeem invite and assign default Member role', async () => {
      const inviteCode = 'test-code-123';
      const userId = 2;
      const serverId = 1;

      const mockInvite = {
        code: inviteCode,
        createdAt: new Date(),
        createdBy: 1,
        expiresAt: null,
        id: 1,
        server: mockServer,
        serverId,
        updatedAt: new Date(),
      };

      const mockMemberRole = {
        id: 2,
        name: 'Member',
        permissions: JSON.stringify({
          addReactions: true,
          connectVoice: true,
          sendMessages: true,
          speakVoice: true,
          viewChannels: true,
        }),
        serverId,
      };

      const mockMembership = {
        role: mockMemberRole,
        roleId: mockMemberRole.id,
        server: mockServer,
        serverId,
        user: {
          email: 'user2@test.com',
          id: userId,
          name: 'User 2',
          username: 'user2',
        },
        userId,
      };

      prisma.invite.findUnique.mockResolvedValue(mockInvite);
      prisma.membership.findUnique.mockResolvedValue(null);

      // Mock transaction
      // eslint-disable-next-line @typescript-eslint/require-await
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          membership: {
            create: jest.fn().mockResolvedValue(mockMembership),
          },
          role: {
            create: jest.fn().mockResolvedValue(mockMemberRole),
            findFirst: jest.fn().mockResolvedValue(null), // No existing Member role
          },
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return callback(mockTx);
      });

      const result = await service.redeemInvite(inviteCode, userId);

      expect(result).toEqual(mockMembership);
      expect(prisma.invite.findUnique).toHaveBeenCalledWith({
        include: { server: true },
        where: { code: inviteCode },
      });
      expect(prisma.membership.findUnique).toHaveBeenCalledWith({
        where: {
          userId_serverId: {
            serverId,
            userId,
          },
        },
      });
    });

    it('should use existing Member role when available', async () => {
      const inviteCode = 'test-code-123';
      const userId = 2;
      const serverId = 1;

      const mockInvite = {
        code: inviteCode,
        createdAt: new Date(),
        createdBy: 1,
        expiresAt: null,
        id: 1,
        server: mockServer,
        serverId,
        updatedAt: new Date(),
      };

      const mockExistingMemberRole = {
        id: 5,
        name: 'Member',
        permissions: JSON.stringify({
          addReactions: true,
          connectVoice: true,
          sendMessages: true,
          speakVoice: true,
          viewChannels: true,
        }),
        serverId,
      };

      const mockMembership = {
        role: mockExistingMemberRole,
        roleId: mockExistingMemberRole.id,
        server: mockServer,
        serverId,
        user: {
          email: 'user2@test.com',
          id: userId,
          name: 'User 2',
          username: 'user2',
        },
        userId,
      };

      prisma.invite.findUnique.mockResolvedValue(mockInvite);
      prisma.membership.findUnique.mockResolvedValue(null);

      // Mock transaction
      // eslint-disable-next-line @typescript-eslint/require-await
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          membership: {
            create: jest.fn().mockResolvedValue(mockMembership),
          },
          role: {
            create: jest.fn(), // Should not be called
            findFirst: jest.fn().mockResolvedValue(mockExistingMemberRole), // Existing Member role found
          },
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return callback(mockTx);
      });

      const result = await service.redeemInvite(inviteCode, userId);

      expect(result).toEqual(mockMembership);
      expect(result.roleId).toBe(mockExistingMemberRole.id);
    });

    it('should throw NotFoundException when invite does not exist', async () => {
      const inviteCode = 'non-existent';
      const userId = 2;

      prisma.invite.findUnique.mockResolvedValue(null);

      await expect(service.redeemInvite(inviteCode, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when invite has expired', async () => {
      const inviteCode = 'expired-code';
      const userId = 2;

      const expiredInvite = {
        code: inviteCode,
        createdAt: new Date(),
        createdBy: 1,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        id: 1,
        server: mockServer,
        serverId: 1,
        updatedAt: new Date(),
      };

      prisma.invite.findUnique.mockResolvedValue(expiredInvite);

      await expect(service.redeemInvite(inviteCode, userId)).rejects.toThrow(
        'Invite has expired',
      );
    });

    it('should throw error when user is already a member', async () => {
      const inviteCode = 'test-code';
      const userId = 2;
      const serverId = 1;

      const mockInvite = {
        code: inviteCode,
        createdAt: new Date(),
        createdBy: 1,
        expiresAt: null,
        id: 1,
        server: mockServer,
        serverId,
        updatedAt: new Date(),
      };

      const existingMembership = {
        createdAt: new Date(),
        roleId: 1,
        serverId,
        updatedAt: new Date(),
        userId,
      };

      prisma.invite.findUnique.mockResolvedValue(mockInvite);
      prisma.membership.findUnique.mockResolvedValue(existingMembership);

      await expect(service.redeemInvite(inviteCode, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
