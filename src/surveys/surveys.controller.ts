import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Query,
	UseGuards,
	UseInterceptors,
	ClassSerializerInterceptor,
} from '@nestjs/common'
import { SurveysService } from './surveys.service'
import { CreateSurveysDto } from './dto/create.dto'
import { UpdateSurveysDto } from './dto/update.dto'
import { TransformInterceptor } from '../interceptors/transform.interceptor'
import { AuthGuard } from '@nestjs/passport'
import { PermissionsGuard } from '../guards/permissions.guard'
import { Permissions } from '../decorator/permissions.decorator'

@Controller('surveys')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)

export class SurveysController {
	constructor(private readonly surveysService: SurveysService) {
	}

	@Post()
	@Permissions('Survey Management::write')
	create(@Body() createSurveysDto: any) {
		return this.surveysService.create(createSurveysDto)
	}

	@Get()
	@Permissions('Survey Management::read')
	findAll(
		@Query('page') page: number,
		@Query('perPage') perPage: number,
		@Query('search') search?: string,
	) {
		const filterOptions = {
			search,
		}
		return this.surveysService.findAll(page, perPage, filterOptions)
	}

	@Get(':id')
	@Permissions('Survey Management::read')
	findOne(@Param('id') id: string) {
		return this.surveysService.findOne(id)
	}

	@Get(':id/report')
	report(@Param('id') id: string,
	       @Query('from') from: string,
	       @Query('to') to: string,
	       @Query('filter') filter?: string) {
		return this.surveysService.reportData(id, from, to, filter)
	}

	@Patch(':id')
	@Permissions('Survey Management::update')
	update(@Param('id') id: string, @Body() updateSurveysDto: any) {
		return this.surveysService.update(id, updateSurveysDto)
	}

	@Patch(':id/main-touchpoint')
	@Permissions('Survey Management::update')
	updateMainTouchpoint(@Param('id') id: string, @Body() updateSurveysTouchpointDto: any) {
		return this.surveysService.updateMainTouchpoint(
			id,
			updateSurveysTouchpointDto,
		)
	}

	@Get(':id/touchpoint')
	@Permissions('Survey Management::read')
	getSurveysTouchpoint(@Param('id') id: string) {
		return this.surveysService.getSurveysTouchpoint(id)
	}

	@Delete(':id')
	@Permissions('Survey Management::delete')
	remove(@Param('id') id: string) {
		return this.surveysService.remove(id)
	}
}
