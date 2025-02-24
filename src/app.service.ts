import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { MailerService } from '@nestjs-modules/mailer';
import { MailtrapClient } from 'mailtrap';

@Injectable()
export class AppService {
  private client: MailtrapClient;
  private sender = {
    email: 'hello@demomailtrap.com',
    name: 'Mailtrap Test',
  };

  constructor() {
    this.client = new MailtrapClient({
      token: '59a71cdda41f91268fbbdf3f1c8ebc64',
    });
  }

  getHello(): string {
    return 'Hello World!';
  }

  async sendComplaintEmail(toEmail: string, variables: { complaint_id: string, submitted_by: string, priority: string, action_link: string }) {
    try {
      const response = await this.client.send({
        from: this.sender,
        to: [{ email: toEmail }],
        template_uuid: 'ecec7c33-55d1-4ad2-9314-6d9131eb76dd',
        template_variables: variables,
      });

      console.log('Email sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // sendMail() {
  //   const message = `Forgot your password? If you didn't forget your password, please ignore this email!`;

  //   this.mailService.sendMail({
  //     from: 'Kingsley Okure <nazermazen@gmail.com>',
  //     to: 'nazir.alkahwaji@gmail.com',
  //     subject: `How to Send Emails with Nodemailer`,
  //     text: message,
  //   });
  // }

}
