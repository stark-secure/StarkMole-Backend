import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private readonly settingModel: Model<SettingDocument>,
  ) {}

  async getSetting(key: string): Promise<any | null> {
    const setting = await this.settingModel.findOne({ key }).exec();
    return setting ? setting.value : null;
  }

  async setSetting(key: string, value: any): Promise<SettingDocument> {
    return this.settingModel.findOneAndUpdate(
      { key },
      { value, updatedAt: Date.now() },
      { upsert: true, new: true }, 
    ).exec();
  }

  async getMaintenanceMode(): Promise<boolean> {
    const setting = await this.getSetting('maintenanceMode');
    return setting?.enabled === true;
  }

  async toggleMaintenanceMode(enabled: boolean): Promise<SettingDocument> {
    return this.setSetting('maintenanceMode', { enabled, message: 'Our platform is currently undergoing scheduled maintenance to improve your experience. We appreciate your patience and will be back online shortly!' });
  }
}