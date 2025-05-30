import {
	Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards,
	UseInterceptors,
	ClassSerializerInterceptor,
	UploadedFile,
} from '@nestjs/common'
import { TouchPointsService } from './touch-points.service'
import { CreateTouchPointDto } from './dto/create.dto'
import { UpdateTouchPointDto } from './dto/update.dto'
import { TransformInterceptor } from '../interceptors/transform.interceptor'
import { AuthGuard } from '@nestjs/passport'
import { PermissionsGuard } from '../guards/permissions.guard'
import { Permissions } from '../decorator/permissions.decorator'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('touchpoints')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(TransformInterceptor)

export class TouchPointsController {
	constructor(private readonly touchpointsService: TouchPointsService) {
	}

	@Post()
	@Permissions('Lookups::write')
	@UseInterceptors(FileInterceptor('file')) // Intercept file upload
	create(@Body() createTouchPointDto: any, @UploadedFile() file: Express.Multer.File) {
		return this.touchpointsService.create(createTouchPointDto, file)
	}

	@Get('grouped-by-category/:type')
	async getTouchpointsGroupedByCategory(@Param('type') type: string) {
		return this.touchpointsService.getTouchpointsGroupedByCategory(type)
	}

	@Get()
	@Permissions('Lookups::read')
	findAll(
		@Query('page') page: number = 1,
		@Query('perPage') perPage: number = 10,
		@Query('filter') filter: string = '',
	) {
		return this.touchpointsService.findAll(page, perPage, filter)
	}


  @Get('search/all')
  findAllSearch(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('filter') filter: string = '',
    @Query('type') type: string = '',
  ) {

    const filterOptions = {
			filter
		}
    return this.touchpointsService.findAllSearch(page, perPage, filterOptions, type);
  }

	@Get('touchpoint/all')
	findAllCategory() {

		return this.touchpointsService.findAllCategory()
	}

	@Get(':id')
	@Permissions('Lookups::read')
	findOne(@Param('id') id: string) {
		return this.touchpointsService.findOne(id)
	}

	@Get('category/:id')
	findByCategory(
		@Param('id') id: string,
		@Query('filledWorkflow') filledWorkflow?: string,
	) {
		// Pass filledWorkflow as boolean to service
		return this.touchpointsService.findByCategory(
			id,
			filledWorkflow === 'true',
		)
	}


	@Get('/rating/high')
	findHLRating() {
		return this.touchpointsService.findHighestRated()
	}

	@Get('/rating/low')
	findLowestRated() {
		return this.touchpointsService.findLowestRated()
	}

	@Patch(':id')
	@Permissions('Lookups::update')
	@UseInterceptors(FileInterceptor('file')) // Intercept file upload
	update(@Param('id') id: string, @Body() updateTouchPointDto: any, @UploadedFile() file: Express.Multer.File) {
		return this.touchpointsService.update_touchpoint(id, updateTouchPointDto, file)
	}

	@Delete(':id')
	@Permissions('Lookups::delete')
	remove(@Param('id') id: string) {
		return this.touchpointsService.remove(id)
	}
}
