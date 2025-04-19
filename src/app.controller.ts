import { Body, Controller, Get, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
// import { ApiKeyGuard } from 'guards/api-key.guard';

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
	// @UseGuards(ApiKeyGuard)
	getHello(): string {
		return this.appService.getHello();
	}

	@Get('health')
	healthCheck() {
	  return { status: 'ok' };
	}
	
}
