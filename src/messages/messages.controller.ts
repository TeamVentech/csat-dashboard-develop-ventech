import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	Put,
	UseInterceptors,
	ClassSerializerInterceptor,
	UseGuards,
} from '@nestjs/common'
import { MessagesService } from './messages.service'
import { CreateMessageDto } from './dto/create-message.dto'
import { UpdateMessageDto } from './dto/update-message.dto'
import { TransformInterceptor } from '../interceptors/transform.interceptor'
import { AuthGuard } from '@nestjs/passport'
import { PermissionsGuard } from '../guards/permissions.guard'
import { Permissions } from '../decorator/permissions.decorator'

@Controller('messages')
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)
export class MessagesController {
	constructor(private readonly messagesService: MessagesService) {
	}

	@UseGuards(AuthGuard('jwt'), PermissionsGuard)
	@Post()
	async create(@Body() createMessageDto: CreateMessageDto) {
		return this.messagesService.create(createMessageDto)
	}

	@UseGuards(AuthGuard('jwt'), PermissionsGuard)
	@Get()
	findAll() {
		return this.messagesService.findAll()
	}

	@UseGuards(AuthGuard('jwt'), PermissionsGuard)
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.messagesService.findOne(id)
	}

	@UseGuards(AuthGuard('jwt'), PermissionsGuard)
	@Put(':id')
	update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
		return this.messagesService.update(id, updateMessageDto)
	}

	@UseGuards(AuthGuard('jwt'), PermissionsGuard)
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.messagesService.remove(id)
	}

	// Public endpoint for getting the message that will be available to all users
	@Get('public/global')
	findPublicMessage() {
		// This will return all messages, but you should modify this to return
		// only the active/latest message based on your business logic
		return this.messagesService.findAll()
	}

	@Get('alias/:alias')
	findByAlias(@Param('alias') alias: string) {
		return this.messagesService.findByAlias(alias)
	}
}
