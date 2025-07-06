import { Controller, Get, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { RolesGuard } from '../auth/guards/roles.guard';     
import { Roles } from '../auth/decorators/roles.decorator';  
import { UserRole } from '../auth/constants';                

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('maintenance')
  @Roles(UserRole.Admin) 
  async getMaintenanceModeStatus() {
    const maintenanceMode = await this.settingsService.getMaintenanceMode();
    const maintenanceSetting = await this.settingsService.getSetting('maintenanceMode');
    return {
      enabled: maintenanceMode,
      message: maintenanceSetting?.message || 'No maintenance message set.'
    };
  }

  @Post('maintenance/toggle')
  @Roles(UserRole.Admin) 
  async toggleMaintenanceMode(@Body('enabled') enabled: boolean) {
    if (typeof enabled !== 'boolean') {
      throw new HttpException('Invalid value for enabled. Must be true or false.', HttpStatus.BAD_REQUEST);
    }
    const setting = await this.settingsService.toggleMaintenanceMode(enabled);
    return {
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully.`,
      status: setting.value.enabled,
    };
  }
}