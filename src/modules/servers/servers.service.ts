import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { nanoid } from 'nanoid';

import { PrismaService } from '../prisma/prisma.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

@Injectable()
export class ServersService {
  private readonly includeOptions = {
    channels: true,
    members: {
      include: {
        role: true,
        user: true,
      },
    },
    roles: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createServerDto: CreateServerDto) {
    try {
      return await this.prisma.server.create({
        include: this.includeOptions,
        data: createServerDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Servername already exists');
      }
      throw error;
    }
  }

  async createInvite(
    serverId: number,
    createdBy: number,
    expiresInDays?: number,
  ) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${serverId} not found`);
    }

    const code = nanoid(10);
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    return await this.prisma.invite.create({
      data: {
        code,
        createdBy,
        expiresAt,
        serverId,
      },
    });
  }

  async findAll() {
    return await this.prisma.server.findMany({
      include: this.includeOptions,
    });
  }

  async findByUserId(userId: number) {
    return await this.prisma.server.findMany({
      include: this.includeOptions,
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const server = await this.prisma.server.findUnique({
      include: this.includeOptions,
      where: { id },
    });
    if (!server) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }
    return server;
  }

  async getServerInvites(serverId: number) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${serverId} not found`);
    }

    return await this.prisma.invite.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      where: { serverId },
    });
  }

  async update(id: number, updateServerDto: UpdateServerDto) {
    try {
      return await this.prisma.server.update({
        include: this.includeOptions,
        where: { id },
        data: updateServerDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Server with ID ${id} not found`);
      }
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Servername already exists');
      }
      throw error;
    }
  }

  async deleteInvite(code: string, serverId: number) {
    const invite = await this.prisma.invite.findUnique({
      where: { code },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.serverId !== serverId) {
      throw new ForbiddenException('Invite does not belong to this server');
    }

    return await this.prisma.invite.delete({
      where: { code },
    });
  }

  async remove(id: number) {
    try {
      return await this.prisma.server.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Server with ID ${id} not found`);
      }
      throw error;
    }
  }

  async redeemInvite(code: string, userId: number) {
    const invite = await this.prisma.invite.findUnique({
      include: {
        server: true,
      },
      where: { code },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new ForbiddenException('Invite has expired');
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        userId_serverId: {
          serverId: invite.serverId,
          userId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of this server');
    }

    // Add user to server
    return await this.prisma.membership.create({
      include: {
        role: true,
        server: true,
        user: {
          select: {
            email: true,
            id: true,
            name: true,
            username: true,
          },
        },
      },
      data: {
        serverId: invite.serverId,
        userId,
      },
    });
  }
}
