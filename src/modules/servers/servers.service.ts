import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { nanoid } from 'nanoid';

import {
  buildOffsetPaginatedResponse,
  OffsetPaginationDto,
} from '@/common/dto/pagination.dto';
import {
  AlreadyMemberOfServerException,
  InviteNotFoundException,
  KordForbiddenException,
  ServernameAlreadyExistsException,
  ServerNotFoundException,
} from '@/common/exceptions/kord.exceptions';

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
        throw new ServernameAlreadyExistsException(createServerDto.servername);
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
      throw new ServerNotFoundException(serverId);
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

  async findAll(pagination: OffsetPaginationDto = {}) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.server.findMany({
        include: this.includeOptions,
        skip,
        take: limit,
      }),
      this.prisma.server.count(),
    ]);

    return buildOffsetPaginatedResponse(items, page, limit, total);
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
      throw new ServerNotFoundException(id);
    }
    return server;
  }

  async getServerInvites(serverId: number) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new ServerNotFoundException(serverId);
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
        throw new ServerNotFoundException(id);
      }
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = error.meta?.target as string[] | undefined;
        if (target?.[0] === 'servername' && updateServerDto.servername) {
          throw new ServernameAlreadyExistsException(
            updateServerDto.servername,
          );
        }
      }
      throw error;
    }
  }

  async deleteInvite(code: string, serverId: number) {
    const invite = await this.prisma.invite.findUnique({
      where: { code },
    });

    if (!invite) {
      throw new InviteNotFoundException(code);
    }

    if (invite.serverId !== serverId) {
      throw new KordForbiddenException('Invite does not belong to this server');
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
        throw new ServerNotFoundException(id);
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
      throw new InviteNotFoundException(code);
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new KordForbiddenException('Invite has expired');
    }

    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        userId_serverId: {
          serverId: invite.serverId,
          userId,
        },
      },
    });

    if (existingMembership) {
      throw new AlreadyMemberOfServerException(userId, invite.serverId);
    }

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
