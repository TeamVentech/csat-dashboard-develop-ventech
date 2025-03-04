import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
	private transporter: nodemailer.Transporter;

	constructor(private configService: ConfigService) {
		this.transporter = nodemailer.createTransport({
			host: 'smtp-relay.brevo.com',
			port: 587,
			secure: false, // Use `true` for port 465, `false` for other ports
			auth: {
				user: '86fc9b001@smtp-brevo.com', // Your Brevo email
				pass: "xsmtpsib-4f7b4e0f03e8151a8e97dd5fe2566f94a91bd171d2d07769365bee1d6d7ae6e3-BgZ9hK8VQOA2frtI", // API Key
			},
		});
	}

	async sendEmail(recipients: string[], from: string, subject: string, text: string,user_name: string, complaint_id: string, submitted_by: string, priority: string, action_link: string) {
		// const mailOptions = {
		// from,
		// to: recipients.join(','),
		// subject,
		// text,body.user_name, body.complaint_id, body.submitted_by, body.priority, body.action_link
		// html,
		// };
		const html = `
		<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
		  <div style="max-width: 600px; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center; margin: auto;">
			<h2 style="color: #333;">New Complaint Assigned</h2>
			<p style="color: #555;">Hello ${user_name},</p>
			<p style="color: #555;">A new complaint has been assigned to you. Please review and take the necessary actions.</p>
			<p style="color: #555;"><strong>Complaint ID:</strong> ${complaint_id}</p>
			<p style="color: #555;"><strong>Submitted By:</strong> ${submitted_by}</p>
			<p style="color: #555;"><strong>Priority:</strong> ${priority}</p>
			<a href="${action_link}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; margin-top: 20px;">Take Action</a>
			<p style="color: #555;">If the button doesn't work, copy and paste the following link into your browser:</p>
			<p style="color: #555;">${action_link}</p>
			<p style="color: #555;">Best Regards,<br>Support Team</p>
		  </div>
		</body>`;
  
		try {
			for (const recipient of recipients) {
				await this.transporter.sendMail({
					from,
					to: recipient,
					subject,
					text,
					html,
				});
				console.log(`Email sent to: ${recipient}`);
				}
		} catch (error) {
			console.error('Error sending email: ', error);
			throw error;
		}
	}
}
