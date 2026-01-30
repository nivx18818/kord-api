import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';

import {
  buildOffsetPaginatedResponse,
  OffsetPaginationDto,
} from '@/common/dto/pagination.dto';
import {
  EmailAlreadyExistsException,
  UsernameAlreadyExistsException,
  UserNotFoundException,
} from '@/common/exceptions/kord.exceptions';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          ...createUserDto,
          dateOfBirth: new Date(createUserDto.dateOfBirth),
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0];

        if (field === 'email') {
          throw new EmailAlreadyExistsException(createUserDto.email);
        } else if (field === 'username') {
          throw new UsernameAlreadyExistsException(createUserDto.username);
        }
      }
      throw error;
    }
  }

  async findAll(pagination: OffsetPaginationDto = {}) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          profile: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    return buildOffsetPaginatedResponse(items, page, limit, total);
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      include: {
        profile: true,
      },
      where: { id },
    });
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return user;
  }

  async findUserServers(userId: number) {
    const user = await this.prisma.user.findUnique({
      include: {
        UserServer: {
          include: {
            role: true,
            server: true,
          },
        },
      },
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return user.UserServer.map((membership) => ({
      ...membership.server,
      joinedAt: membership.createdAt,
      role: membership.role,
    }));
  }

  async getMutedUsers(userId: number) {
    return await this.prisma.userMute.findMany({
      include: {
        target: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      where: { userId },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          dateOfBirth:
            updateUserDto.dateOfBirth && new Date(updateUserDto.dateOfBirth),
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new UserNotFoundException(id);
      }
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0];

        if (field === 'email' && updateUserDto.email) {
          throw new EmailAlreadyExistsException(updateUserDto.email);
        } else if (field === 'username' && updateUserDto.username) {
          throw new UsernameAlreadyExistsException(updateUserDto.username);
        }
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new UserNotFoundException(id);
      }
      throw error;
    }
  }

  async muteUser(userId: number, targetId: number, reason?: string) {
    if (userId === targetId) {
      throw new BadRequestException('Cannot mute yourself');
    }

    // Check if both users exist
    const [user, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: targetId } }),
    ]);

    if (!user) {
      throw new UserNotFoundException(userId);
    }
    if (!target) {
      throw new UserNotFoundException(targetId);
    }

    try {
      return await this.prisma.userMute.create({
        data: {
          reason,
          targetId,
          userId,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('User already muted');
      }
      throw error;
    }
  }

  async unmuteUser(userId: number, targetId: number) {
    const mute = await this.prisma.userMute.findFirst({
      where: { targetId, userId },
    });

    if (!mute) {
      throw new BadRequestException('Mute not found');
    }

    return await this.prisma.userMute.delete({
      where: { id: mute.id },
    });
  }
}
