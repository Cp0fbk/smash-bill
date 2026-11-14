import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MatchService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.match.findUnique({
      where: { id },
      include: {
        expenses: true,
        attendances: {
          include: {
            clubMember: true,
          },
        },
      },
    });
  }
}
