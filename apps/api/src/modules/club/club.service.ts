import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClubService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string) {
    return this.prisma.club.findUnique({
      where: { slug },
      include: {
        members: {
          where: { isActive: true },
        },
      },
    });
  }
}
