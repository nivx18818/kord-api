/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockPrismaService,
  createMockServerWithRelations,
  mockServer,
} from 'test/utils';

import { RolesGuard } from '@/common/guards/roles.guard';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { CreateServerDto } from '@/modules/servers/dto/create-server.dto';
import { UpdateServerDto } from '@/modules/servers/dto/update-server.dto';
import { ServersController } from '@/modules/servers/servers.controller';
import { ServersService } from '@/modules/servers/servers.service';

describe('ServersController', () => {
  let controller: ServersController;
  let service: ServersService;

  const mockServersService = {
    create: jest.fn(),
    createInvite: jest.fn(),
    findAll: jest.fn(),
    findByUserId: jest.fn(),
    findOne: jest.fn(),
    getServerInvites: jest.fn(),
    redeemInvite: jest.fn(),
    remove: jest.fn(),
    removeInvite: jest.fn(),
    update: jest.fn(),
  };

  const mockRolesGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServersController],
      providers: [
        {
          provide: ServersService,
          useValue: mockServersService,
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<ServersController>(ServersController);
    service = module.get<ServersService>(ServersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new server', async () => {
      const createServerDto: CreateServerDto = {
        name: 'Test Server',
        servername: 'testserver',
      };

      const mockUser = {
        email: 'test@example.com',
        id: 1,
        username: 'testuser',
      };

      const server = createMockServerWithRelations();
      mockServersService.create.mockResolvedValue(server);

      const result = await controller.create(createServerDto, mockUser);

      expect(result).toEqual(server);
      expect(service.create).toHaveBeenCalledWith(createServerDto, mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return an array of servers', async () => {
      const servers = [createMockServerWithRelations()];
      mockServersService.findAll.mockResolvedValue(servers);

      const result = await controller.findAll(undefined, '10', '1');

      expect(result).toEqual(servers);
      expect(service.findAll).toHaveBeenCalledWith({ limit: 10, page: 1 });
    });

    it('should return servers by userId when provided', async () => {
      const servers = [createMockServerWithRelations()];
      mockServersService.findByUserId.mockResolvedValue(servers);

      const result = await controller.findAll('1', undefined, undefined);

      expect(result).toEqual(servers);
      expect(service.findByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return a server by id', async () => {
      const server = createMockServerWithRelations();
      mockServersService.findOne.mockResolvedValue(server);

      const result = await controller.findOne('1');

      expect(result).toEqual(server);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a server', async () => {
      const updateServerDto: UpdateServerDto = {
        name: 'Updated Server',
      };

      const updatedServer = { ...mockServer, name: 'Updated Server' };
      mockServersService.update.mockResolvedValue(updatedServer);

      const result = await controller.update('1', updateServerDto);

      expect(result).toEqual(updatedServer);
      expect(service.update).toHaveBeenCalledWith(1, updateServerDto);
    });
  });

  describe('remove', () => {
    it('should delete a server', async () => {
      mockServersService.remove.mockResolvedValue(mockServer);

      const result = await controller.remove('1');

      expect(result).toEqual(mockServer);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
