import { Body, Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('send')
	async sendComplaint(@Body() body: { email: string, complaint_id: string, submitted_by: string, priority: string, action_link: string }) {
		return await this.appService.sendComplaintEmail(body.email, {
			complaint_id: body.complaint_id,
			submitted_by: body.submitted_by,
			priority: body.priority,
			action_link: body.action_link,
		});
	}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}
}
