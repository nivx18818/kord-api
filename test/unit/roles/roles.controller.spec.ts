/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { mockRole } from 'test/utils';

import { CreateRoleDto } from '@/modules/roles/dto/create-role.dto';
import { UpdateRoleDto } from '@/modules/roles/dto/update-role.dto';
import { RolesController } from '@/modules/roles/roles.controller';
import { RolesService } from '@/modules/roles/roles.service';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const mockRolesService = {
    assignRolesToUser: jest.fn(),
    checkServerPermissions: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getUserRoles: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Admin',
        permissions: { kickUsers: true, manageChannels: true },
        serverId: 1,
      };

      mockRolesService.create.mockResolvedValue(mockRole);

      const result = await controller.create(createRoleDto);

      expect(result).toEqual(mockRole);
      expect(service.create).toHaveBeenCalledWith(createRoleDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      const roles = [mockRole];
      mockRolesService.findAll.mockResolvedValue(roles);

      const result = await controller.findAll();

      expect(result).toEqual(roles);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      mockRolesService.findOne.mockResolvedValue(mockRole);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockRole);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('getUserRoles', () => {
    it('should return roles for a user in a server', async () => {
      const roles = [mockRole];
      mockRolesService.getUserRoles.mockResolvedValue(roles);

      const result = await controller.getUserRoles('1', '1');

      expect(result).toEqual(roles);
      expect(service.getUserRoles).toHaveBeenCalledWith(1, 1);
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
      mockRolesService.update.mockResolvedValue(updatedRole);

      const result = await controller.update('1', updateRoleDto);

      expect(result).toEqual(updatedRole);
      expect(service.update).toHaveBeenCalledWith(1, updateRoleDto);
    });
  });

  describe('remove', () => {
    it('should delete a role', async () => {
      mockRolesService.remove.mockResolvedValue(mockRole);

      const result = await controller.remove('1');

      expect(result).toEqual(mockRole);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
