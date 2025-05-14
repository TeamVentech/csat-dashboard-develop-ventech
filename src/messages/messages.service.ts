import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { Message } from './entities/message.entity'
import { CreateMessageDto } from './dto/create-message.dto'
import { UpdateMessageDto } from './dto/update-message.dto'

@Injectable()
export class MessagesService {
	constructor(
		@Inject('MESSAGE_REPOSITORY')
		private messageRepository: Repository<Message>,
	) {
	}

	async create(createMessageDto: CreateMessageDto) {
		// Create content object
		const contentObject = {
			ar: createMessageDto.content_ar,
			en: createMessageDto.content_en,
		}

		const message = this.messageRepository.create({
			content: contentObject,
		})

		return this.messageRepository.save(message)
	}

	async findAll() {
		return this.messageRepository.find()
	}

	async findOne(id: string) {
		const message = await this.messageRepository.findOne({ where: { id } })
		if (!message) {
			throw new NotFoundException(`Message with ID ${id} not found`)
		}
		return message
	}

	async findByAlias(alias: string) {
		const message = await this.messageRepository.findOne({ where: { alias } })
		if (!message) {
			throw new NotFoundException(`Message with alias "${alias}" not found`)
		}
		return message
	}

	async update(id: string, updateMessageDto: UpdateMessageDto) {
		const message = await this.findOne(id)

		// Only update properties that are provided
		const contentUpdate: any = { ...message.content }

		if (updateMessageDto.content_ar) {
			contentUpdate.ar = updateMessageDto.content_ar
		}

		if (updateMessageDto.content_en) {
			contentUpdate.en = updateMessageDto.content_en
		}
		const payload = {
			content: contentUpdate,
			isActive: message.isActive,
			alias: message.alias,

		}
		if (updateMessageDto.isActive == true || updateMessageDto.isActive == false) {
			payload.isActive = updateMessageDto.isActive
		}
		if (updateMessageDto.alias) {
			payload.alias = updateMessageDto.alias
		}
		await this.messageRepository.update(id, payload)

		return this.findOne(id)
	}

	async remove(id: string) {
		const message = await this.findOne(id)
		await this.messageRepository.remove(message)
		return { success: true }
	}
}
