import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { MailtrapClient } from 'mailtrap';

@Injectable()
export class EmailService {
	private transporter: nodemailer.Transporter;
	private mailtrapClient: MailtrapClient;
	private mailtrapSender = {
		email: 'hello@demomailtrap.com',
		name: 'CSAT MANAGEMENT',
	};

	constructor(private configService: ConfigService) {
		this.transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: 'nazir.alkahwaji@gmail.com', // Your Gmail email
				pass: "crdgwksoigtaifwp", // API Key
			},
		});

		// Initialize Mailtrap client as fallback
		this.mailtrapClient = new MailtrapClient({
			token: '59a71cdda41f91268fbbdf3f1c8ebc64',
		});
	}

	async sendEmail(recipients: string[], from: string, subject: string, text: string, user_name: string, complaint_id: string, submitted_by: string, priority: string, action_link: string) {
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
  
		let anySuccessful = false;
		let lastError = null;

		// Try sending with Gmail first
		try {
			for (const recipient of recipients) {
				try {
					await this.transporter.sendMail({
						from,
						to: recipient,
						subject,
						text,
						html,
					});
					console.log(`Email sent to: ${recipient} via Gmail`);
					anySuccessful = true;
				} catch (error) {
					console.warn(`Failed to send email to ${recipient} via Gmail: ${error.message}`);
					lastError = error;
					
					// If Gmail fails (likely due to sending limit), use Mailtrap as fallback
					if (error.responseCode === 550 || error.code === 'EENVELOPE') {
						try {
							await this.sendViaMailtrap(recipient, subject, html, {
								complaint_id,
								submitted_by,
								priority,
								action_link
							});
							console.log(`Email sent to: ${recipient} via Mailtrap (fallback)`);
							anySuccessful = true;
						} catch (mailtrapError) {
							console.error(`Mailtrap fallback also failed for ${recipient}: ${mailtrapError.message}`);
							lastError = mailtrapError;
						}
					}
				}
			}
		} catch (error) {
			console.error('Error in email sending loop: ', error);
			lastError = error;
		}

		// If no emails were sent successfully, throw the last error
		if (!anySuccessful && lastError) {
			console.error('All email sending attempts failed');
			// Don't throw to prevent crashing the application
			return { success: false, error: lastError.message };
		}

		return { success: true };
	}

	private async sendViaMailtrap(recipient: string, subject: string, html: string, variables: { 
		complaint_id: string, 
		submitted_by: string, 
		priority: string, 
		action_link: string 
	}) {
		return this.mailtrapClient.send({
			from: this.mailtrapSender,
			to: [{ email: recipient }],
			subject,
			html,
			// Can use template if needed
			// template_uuid: 'ecec7c33-55d1-4ad2-9314-6d9131eb76dd',
			// template_variables: variables,
		});
	}
}
