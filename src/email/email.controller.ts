import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async sendEmail(@Body() body: { recipients: string[]; from: string; subject: string; text: string;  user_name: string, complaint_id: string, submitted_by: string, priority: string, action_link: string }) {

    return this.emailService.sendEmail(body.recipients, body.from, body.subject, body.text, body.user_name, body.complaint_id, body.submitted_by, body.priority, body.action_link);
  }
}
