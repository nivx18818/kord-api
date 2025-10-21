/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { mockMembership } from 'test/utils';

import { CreateMembershipDto } from '@/modules/memberships/dto/create-membership.dto';
import { UpdateMembershipDto } from '@/modules/memberships/dto/update-membership.dto';
import { MembershipsController } from '@/modules/memberships/memberships.controller';
import { MembershipsService } from '@/modules/memberships/memberships.service';

describe('MembershipsController', () => {
  let controller: MembershipsController;
  let service: MembershipsService;

  const mockMembershipsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipsController],
      providers: [
        {
          provide: MembershipsService,
          useValue: mockMembershipsService,
        },
      ],
    }).compile();

    controller = module.get<MembershipsController>(MembershipsController);
    service = module.get<MembershipsService>(MembershipsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new membership', async () => {
      const createMembershipDto: CreateMembershipDto = {
        serverId: 1,
        userId: 1,
      };

      mockMembershipsService.create.mockResolvedValue(mockMembership);

      const result = await controller.create(createMembershipDto);

      expect(result).toEqual(mockMembership);
      expect(service.create).toHaveBeenCalledWith(createMembershipDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of memberships', async () => {
      const memberships = [mockMembership];
      mockMembershipsService.findAll.mockResolvedValue(memberships);

      const result = await controller.findAll();

      expect(result).toEqual(memberships);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a membership by composite key', async () => {
      mockMembershipsService.findOne.mockResolvedValue(mockMembership);

      const result = await controller.findOne('1', '1');

      expect(result).toEqual(mockMembership);
      expect(service.findOne).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('update', () => {
    it('should update a membership', async () => {
      const updateMembershipDto: UpdateMembershipDto = {
        roleId: 2,
      };

      const updatedMembership = {
        ...mockMembership,
        roleId: 2,
      };
      mockMembershipsService.update.mockResolvedValue(updatedMembership);

      const result = await controller.update('1', '1', updateMembershipDto);

      expect(result).toEqual(updatedMembership);
      expect(service.update).toHaveBeenCalledWith(1, 1, updateMembershipDto);
    });
  });

  describe('remove', () => {
    it('should delete a membership', async () => {
      mockMembershipsService.remove.mockResolvedValue(mockMembership);

      const result = await controller.remove('1', '1');

      expect(result).toEqual(mockMembership);
      expect(service.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
