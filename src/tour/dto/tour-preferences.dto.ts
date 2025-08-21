import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TourPreferencesDto {
    @ApiProperty({ description: 'Budget range' })
    @IsString()
    budget: string;

    @ApiProperty({ description: 'Travel interests', type: [String] })
    @IsArray()
    @IsString({ each: true })
    interests: string[];

    @ApiProperty({ description: 'Travel style preference' })
    @IsString()
    travelStyle: string;

    @ApiProperty({ description: 'Trip duration in days' })
    @IsNumber()
    duration: number;

    @ApiProperty({ description: 'Number of travelers' })
    @IsNumber()
    groupSize: number;

    @ApiProperty({ description: 'Preferred destination', required: false })
    @IsOptional()
    @IsString()
    destination?: string;
}

// src/tour/interfaces/tour.interface.ts
export interface TourStop {
    time: string;
    location: string;
    description: string;
    tips: string[];
    duration: string;
    vehicleInstructions?: string;
    groupDistribution?: string;
    estimatedCost?: number;
    accessibility?: string;
    photoOpportunities?: string[];
}

export interface VehicleAssignment {
    vehicleId: string;
    vehicleType: string;
    occupants: number;
    route: string;
    parkingInstructions?: string;
    driverNotes?: string;
}

export interface Tour {
    id: string;
    title: string;
    destination: string;
    duration: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    highlights: string[];
    itinerary: TourStop[];
    vehicleAssignments: VehicleAssignment[];
    recommendations: string[];
    createdAt: Date;
    totalBudget: number;
    totalParticipants: number;
    budgetBreakdown?: {
        transportation: number;
        accommodation: number;
        meals: number;
        activities: number;
        miscellaneous: number;
    };
    logisticsNotes: string[];
    emergencyContacts?: string[];
}
