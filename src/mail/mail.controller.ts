import { Controller, Get, Query } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Get('test')
  async testSend(@Query('to') to: string) {
    await this.mailService.sendTestEmail(to);
    return { message: `Test email sent to ${to}` };
  }
}
