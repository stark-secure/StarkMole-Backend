import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async getSetting(key: string): Promise<any | null> {
    const setting = await this.settingRepository.findOne({ where: { key } });
    return setting ? JSON.parse(setting.value) : null;
  }

  async setSetting(key: string, value: any): Promise<Setting> {
    const existingSetting = await this.settingRepository.findOne({
      where: { key },
    });

    if (existingSetting) {
      existingSetting.value = JSON.stringify(value);
      return this.settingRepository.save(existingSetting);
    } else {
      const newSetting = this.settingRepository.create({
        key,
        value: JSON.stringify(value),
      });
      return this.settingRepository.save(newSetting);
    }
  }

  async getMaintenanceMode(): Promise<boolean> {
    const setting = await this.getSetting('maintenanceMode');
    return setting?.enabled === true;
  }

  async toggleMaintenanceMode(enabled: boolean): Promise<Setting> {
    return this.setSetting('maintenanceMode', {
      enabled,
      message:
        'Our platform is currently undergoing scheduled maintenance to improve your experience. We appreciate your patience and will be back online shortly!',
    });
  }
}
