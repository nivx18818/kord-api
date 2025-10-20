import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMembershipDto: CreateMembershipDto) {
    return this.prisma.membership.create({
      include: {
        role: true,
        server: true,
        user: true,
      },
      data: createMembershipDto,
    });
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
    return this.prisma.membership.update({
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
  }

  async remove(userId: number, serverId: number) {
    return this.prisma.membership.delete({
      where: {
        userId_serverId: {
          serverId,
          userId,
        },
      },
    });
  }
}
