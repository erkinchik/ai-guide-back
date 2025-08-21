import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TourService } from './tour.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { TourPreferencesDto } from './dto/tour-preferences.dto';
import { Tour } from './interfaces/tour.interface';

@ApiTags('tours')
@Controller('tours')
export class TourController {
    constructor(private readonly tourService: TourService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new AI-generated tour' })
    @ApiResponse({ status: 201, description: 'Tour created successfully' })
    async createTour(@Body() createTourDto: CreateTourDto): Promise<Tour> {
        try {
            return await this.tourService.createTour(createTourDto);
        } catch (error) {
            throw new HttpException(
                `Failed to create tour: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all tours' })
    @ApiResponse({ status: 200, description: 'List of all tours' })
    async getAllTours(): Promise<Tour[]> {
        return this.tourService.getAllTours();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get tour by ID' })
    @ApiResponse({ status: 200, description: 'Tour details' })
    @ApiResponse({ status: 404, description: 'Tour not found' })
    async getTourById(@Param('id') id: string): Promise<Tour> {
        return this.tourService.getTourById(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update tour by ID' })
    @ApiResponse({ status: 200, description: 'Tour updated successfully' })
    @ApiResponse({ status: 404, description: 'Tour not found' })
    async updateTour(
        @Param('id') id: string,
        @Body() updateTourDto: Partial<CreateTourDto>
    ): Promise<Tour> {
        return this.tourService.updateTour(id, updateTourDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete tour by ID' })
    @ApiResponse({ status: 200, description: 'Tour deleted successfully' })
    @ApiResponse({ status: 404, description: 'Tour not found' })
    async deleteTour(@Param('id') id: string): Promise<{ message: string }> {
        await this.tourService.deleteTour(id);
        return { message: 'Tour deleted successfully' };
    }

    @Get('location/:location')
    @ApiOperation({ summary: 'Get information about a specific location' })
    @ApiResponse({ status: 200, description: 'Location information' })
    async getLocationInfo(@Param('location') location: string): Promise<{ info: string }> {
        const info = await this.tourService.getLocationInfo(location);
        return { info };
    }

    @Post('optimize')
    @ApiOperation({ summary: 'Optimize tour based on real-time conditions' })
    @ApiResponse({ status: 200, description: 'Optimized tour suggestions' })
    async optimizeTour(
        @Body() optimizationData: {
            tourId: string;
            currentConditions: any;
            preferences: any;
        }
    ): Promise<{ suggestions: string; alternativeRoutes: any[] }> {
        const tour = await this.tourService.getTourById(optimizationData.tourId);
        const optimization = await this.tourService.optimizeTourRoute(
            tour,
            optimizationData.currentConditions,
            optimizationData.preferences
        );
        return optimization;
    }

    @Post('vehicle-assignments')
    @ApiOperation({ summary: 'Generate optimal vehicle assignments' })
    @ApiResponse({ status: 200, description: 'Vehicle assignment recommendations' })
    async generateVehicleAssignments(
        @Body() assignmentData: {
            participants: Array<{ name: string; preferences: any; mobility: number }>;
            vehicles: Array<{ type: string; capacity: number; features: string[] }>;
            destinations: string[];
        }
    ): Promise<{ assignments: any[]; reasoning: string }> {
        return this.tourService.generateVehicleAssignments(assignmentData);
    }

    @Get('analytics/:id')
    @ApiOperation({ summary: 'Get tour analytics and insights' })
    @ApiResponse({ status: 200, description: 'Tour analytics data' })
    async getTourAnalytics(@Param('id') id: string): Promise<{
        costAnalysis: any;
        timeAnalysis: any;
        efficiencyMetrics: any;
        suggestions: string[];
    }> {
        return this.tourService.getTourAnalytics(id);
    }
}
