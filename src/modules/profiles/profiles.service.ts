import { Injectable } from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  type ProfileInclude,
} from 'generated/prisma/internal/prismaNamespace';

import {
  ProfileAlreadyExistsException,
  ProfileNotFoundException,
} from '@/common/exceptions/kord.exceptions';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  private readonly includeOptions: ProfileInclude = {
    user: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(createProfileDto: CreateProfileDto) {
    try {
      return await this.prisma.profile.create({
        include: this.includeOptions,
        data: createProfileDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ProfileAlreadyExistsException(createProfileDto.userId);
      }
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.profile.findMany({
      include: this.includeOptions,
    });
  }

  async findOne(userId: number) {
    return await this.prisma.profile.findUnique({
      include: this.includeOptions,
      where: { userId },
    });
  }

  async update(userId: number, updateProfileDto: UpdateProfileDto) {
    try {
      return await this.prisma.profile.update({
        include: this.includeOptions,
        where: { userId },
        data: updateProfileDto,
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ProfileNotFoundException(userId);
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
        throw new ProfileNotFoundException(userId);
      }
      throw error;
    }
  }
}
