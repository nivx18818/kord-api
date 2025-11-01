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
import { CreateServerDto } from '@/modules/servers/dto/create-server.dto';
import { UpdateServerDto } from '@/modules/servers/dto/update-server.dto';
import { ServersService } from '@/modules/servers/servers.service';

describe('ServersService', () => {
  let service: ServersService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ServersService>(ServersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a server', async () => {
      const createServerDto: CreateServerDto = {
        name: 'Test Server',
        servername: 'testserver',
      };

      const serverWithRelations = createMockServerWithRelations();
      prisma.server.create.mockResolvedValue(serverWithRelations);

      const result = await service.create(createServerDto);

      expect(result).toEqual(serverWithRelations);
      expect(prisma.server.create.mock.calls.length).toBeGreaterThan(0);
    });

    it('should throw ConflictException when servername already exists', async () => {
      const createServerDto: CreateServerDto = {
        name: 'Test Server',
        servername: 'testserver',
      };

      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          clientVersion: '5.0.0',
          code: 'P2002',
          meta: { target: ['servername'] },
        },
      );

      prisma.server.create.mockRejectedValue(prismaError);

      await expect(service.create(createServerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createServerDto)).rejects.toThrow(
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
});
