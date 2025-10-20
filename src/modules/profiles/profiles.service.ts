import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProfileDto: CreateProfileDto) {
    try {
      return await this.prisma.profile.create({
        include: {
          user: true,
        },
        data: createProfileDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Profile for this user already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.profile.findMany({
      include: {
        user: true,
      },
    });
  }

  async findOne(userId: number) {
    return await this.prisma.profile.findUnique({
      include: {
        user: true,
      },
      where: { userId },
    });
  }

  async update(userId: number, updateProfileDto: UpdateProfileDto) {
    try {
      return await this.prisma.profile.update({
        include: {
          user: true,
        },
        where: { userId },
        data: updateProfileDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Profile for user ID ${userId} not found`);
      }
      throw error;
    }
  }

  async remove(userId: number) {
    try {
      return await this.prisma.profile.delete({
        where: { userId },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Profile for user ID ${userId} not found`);
      }
      throw error;
    }
  }
}
