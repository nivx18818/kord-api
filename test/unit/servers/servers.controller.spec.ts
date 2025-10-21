/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { createMockServerWithRelations, mockServer } from 'test/utils';

import { CreateServerDto } from '@/modules/servers/dto/create-server.dto';
import { UpdateServerDto } from '@/modules/servers/dto/update-server.dto';
import { ServersController } from '@/modules/servers/servers.controller';
import { ServersService } from '@/modules/servers/servers.service';

describe('ServersController', () => {
  let controller: ServersController;
  let service: ServersService;

  const mockServersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServersController],
      providers: [
        {
          provide: ServersService,
          useValue: mockServersService,
        },
      ],
    }).compile();

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

      const server = createMockServerWithRelations();
      mockServersService.create.mockResolvedValue(server);

      const result = await controller.create(createServerDto);

      expect(result).toEqual(server);
      expect(service.create).toHaveBeenCalledWith(createServerDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of servers', async () => {
      const servers = [createMockServerWithRelations()];
      mockServersService.findAll.mockResolvedValue(servers);

      const result = await controller.findAll();

      expect(result).toEqual(servers);
      expect(service.findAll).toHaveBeenCalled();
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
