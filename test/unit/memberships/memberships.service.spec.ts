/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { createMockPrismaService, mockMembership } from 'test/utils';

import { CreateMembershipDto } from '@/modules/memberships/dto/create-membership.dto';
import { UpdateMembershipDto } from '@/modules/memberships/dto/update-membership.dto';
import { MembershipsService } from '@/modules/memberships/memberships.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a membership', async () => {
      const createMembershipDto: CreateMembershipDto = {
        serverId: 1,
        userId: 1,
      };

      const membershipWithRelations = {
        ...mockMembership,
        role: {},
        server: {},
        user: {},
      };
      prisma.membership.create.mockResolvedValue(membershipWithRelations);

      const result = await service.create(createMembershipDto);

      expect(result).toEqual(membershipWithRelations);
      expect(prisma.membership.create.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('findAll', () => {
    it('should return an array of memberships', async () => {
      const memberships = [mockMembership];
      prisma.membership.findMany.mockResolvedValue(memberships);

      const result = await service.findAll();

      expect(result).toEqual(memberships);
      expect(prisma.membership.findMany.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a membership by composite key', async () => {
      prisma.membership.findUnique.mockResolvedValue(mockMembership);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockMembership);
      expect(prisma.membership.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_serverId: {
              serverId: 1,
              userId: 1,
            },
          },
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a membership', async () => {
      const updateMembershipDto: UpdateMembershipDto = {
        roleIds: [2],
      };

      const updatedMembership = {
        ...mockMembership,
        roles: [
          {
            roleId: 2,
            userId: 1,
            serverId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: {
              id: 2,
              name: 'Admin',
              serverId: 1,
              permissions: '{}',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
      };
      prisma.membership.update.mockResolvedValue(updatedMembership);

      const result = await service.update(1, 1, updateMembershipDto);

      expect(result.roles).toBeDefined();
      expect(result.roles[0].roleId).toBe(2);
      expect(prisma.membership.update.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('remove', () => {
    it('should delete a membership', async () => {
      prisma.membership.delete.mockResolvedValue(mockMembership);

      const result = await service.remove(1, 1);

      expect(result).toEqual(mockMembership);
      expect(prisma.membership.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_serverId: {
              serverId: 1,
              userId: 1,
            },
          },
        }),
      );
    });
  });
});
