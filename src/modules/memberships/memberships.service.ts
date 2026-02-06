import { Injectable } from '@nestjs/common';
import {
  type MembershipInclude,
  PrismaClientKnownRequestError,
} from 'generated/prisma/internal/prismaNamespace';

import {
  AlreadyMemberOfServerException,
  MembershipNotFoundException,
  NotMemberOfServerException,
  ServerNotFoundException,
  UserNotFoundException,
} from '@/common/exceptions/kord.exceptions';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

@Injectable()
export class MembershipsService {
  private readonly includeOptions: MembershipInclude = {
    roles: {
      include: {
        role: true,
      },
    },
    server: true,
    user: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createMembershipDto: CreateMembershipDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const membership = await tx.membership.create({
          include: this.includeOptions,
          data: {
            serverId: createMembershipDto.serverId,
            userId: createMembershipDto.userId,
          },
        });

        if (
          createMembershipDto.roleIds &&
          createMembershipDto.roleIds.length > 0
        ) {
          await Promise.all(
            createMembershipDto.roleIds.map((roleId) =>
              tx.membershipRole.create({
                data: {
                  roleId,
                  serverId: createMembershipDto.serverId,
                  userId: createMembershipDto.userId,
                },
              }),
            ),
          );
        }

        return membership;
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AlreadyMemberOfServerException(
          createMembershipDto.userId,
          createMembershipDto.serverId,
        );
      }
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        const meta = error.meta as { field_name?: string };
        if (meta?.field_name?.includes('userId')) {
          throw new UserNotFoundException(createMembershipDto.userId);
        }
        throw new ServerNotFoundException(createMembershipDto.serverId);
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.membership.findMany({
      include: this.includeOptions,
    });
  }

  async findOne(userId: number, serverId: number) {
    return this.prisma.membership.findUnique({
      include: this.includeOptions,
      where: {
        userId_serverId: {
          serverId,
          userId,
        },
      },
    });
  }

  async update(
    userId: number,
    serverId: number,
    updateMembershipDto: UpdateMembershipDto,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const membership = await tx.membership.update({
          include: this.includeOptions,
          where: {
            userId_serverId: {
              serverId,
              userId,
            },
          },
          data: {},
        });

        if (updateMembershipDto.roleIds) {
          await tx.membershipRole.deleteMany({
            where: {
              serverId,
              userId,
            },
          });

          if (updateMembershipDto.roleIds.length > 0) {
            await Promise.all(
              updateMembershipDto.roleIds.map((roleId) =>
                tx.membershipRole.create({
                  data: {
                    roleId,
                    serverId,
                    userId,
                  },
                }),
              ),
            );
          }
        }

        return membership;
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new MembershipNotFoundException(userId, serverId);
      }
      throw error;
    }
  }

  async remove(userId: number, serverId: number) {
    try {
      return await this.prisma.membership.delete({
        where: {
          userId_serverId: {
            serverId,
            userId,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotMemberOfServerException();
      }
      throw error;
    }
  }
}
