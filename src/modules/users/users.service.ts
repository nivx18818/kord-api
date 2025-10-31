import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

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
        throw new ConflictException('Username or email already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.user.findMany({
      include: {
        profile: true,
      },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      include: {
        profile: true,
      },
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
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
      throw new NotFoundException(`User with ID ${userId} not found`);
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
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username or email already exists');
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
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw error;
    }
  }

  async muteUser(userId: number, targetId: number, reason?: string) {
    if (userId === targetId) {
      throw new ConflictException('Cannot mute yourself');
    }

    // Check if both users exist
    const [user, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: targetId } }),
    ]);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    if (!target) {
      throw new NotFoundException(`Target user with ID ${targetId} not found`);
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
        throw new ConflictException('User already muted');
      }
      throw error;
    }
  }

  async unmuteUser(userId: number, targetId: number) {
    const mute = await this.prisma.userMute.findFirst({
      where: { targetId, userId },
    });

    if (!mute) {
      throw new NotFoundException('Mute not found');
    }

    return await this.prisma.userMute.delete({
      where: { id: mute.id },
    });
  }
}
