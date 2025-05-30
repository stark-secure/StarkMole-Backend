/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Analytics } from './entities/analytics.entity';
import { Repository } from 'typeorm';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private analyticsRepo: Repository<Analytics>,
  ) {}

  async logEvent(dto: CreateAnalyticsDto): Promise<void> {
    const entry = this.analyticsRepo.create(dto);
    await this.analyticsRepo.save(entry);
  }

  async getAllLogs(): Promise<Analytics[]> {
    return this.analyticsRepo.find({ order: { timestamp: 'DESC' } });
  }

  async getUserLogs(userId: string): Promise<Analytics[]> {
    return this.analyticsRepo.find({
      where: { userId },
      order: { timestamp: 'DESC' },
    });
  }
}
