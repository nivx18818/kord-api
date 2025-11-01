import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

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
  constructor(private readonly prisma: PrismaService) {}

  async create(createMembershipDto: CreateMembershipDto) {
    try {
      return await this.prisma.membership.create({
        include: {
          role: true,
          server: true,
          user: true,
        },
        data: createMembershipDto,
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
      include: {
        role: true,
        server: true,
        user: true,
      },
    });
  }

  async findOne(userId: number, serverId: number) {
    return this.prisma.membership.findUnique({
      include: {
        role: true,
        server: true,
        user: true,
      },
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
      return await this.prisma.membership.update({
        include: {
          role: true,
          server: true,
          user: true,
        },
        where: {
          userId_serverId: {
            serverId,
            userId,
          },
        },
        data: updateMembershipDto,
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
