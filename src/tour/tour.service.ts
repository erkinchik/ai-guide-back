import { Injectable, NotFoundException } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { TourPreferencesDto } from './dto/tour-preferences.dto';
import { Tour } from './interfaces/tour.interface';

@Injectable()
export class TourService {
    private tours: Tour[] = [];

    constructor(private openaiService: OpenAIService) {}

    async createTour(createTourDto: CreateTourDto): Promise<Tour> {
        this.validateVehicleConfiguration(createTourDto);

        const prompt = this.buildTourPrompt(createTourDto);

        try {
            const aiResponse = await this.openaiService.generateTour(prompt);
            const tourData = this.parseAIResponse(aiResponse);
            const parsedTour = JSON.parse(tourData.itinerary[0].description.replace(/^```json\s*/, '').replace(/\s*```$/, ''))

            const totalParticipants = createTourDto.vehicles.reduce((sum, v) => sum + v.occupants, 0);

            const tour: any = {
                id: this.generateId(),
                ...tourData,
                destination: createTourDto.primaryRegion,
                createdAt: new Date(),
                totalBudget: createTourDto.budget,
                totalParticipants,
            };

            console.log(parsedTour)
            this.tours.push(tour);
            return tour;
        } catch (error) {
            throw new Error(`Failed to create tour: ${error.message}`);
        }
    }

    // async optimizeTourRoute(tour: Tour, currentConditions: any, preferences: any): Promise<{
    //     suggestions: string;
    //     alternativeRoutes: any[];
    // }> {
    //     const optimizationPrompt = `Optimize this tour based on current conditions and preferences:
    //
    // CURRENT TOUR: ${JSON.stringify(tour, null, 2)}
    //
    // CURRENT CONDITIONS:
    // - Weather: ${currentConditions.weather || 'Unknown'}
    // - Traffic: ${currentConditions.traffic || 'Normal'}
    // - Events: ${currentConditions.events || 'None'}
    // - Time constraints: ${currentConditions.timeConstraints || 'None'}
    //
    // PREFERENCES:
    // - Priority changes: ${preferences.priorityChanges || 'None'}
    // - New constraints: ${preferences.newConstraints || 'None'}
    //
    // Provide optimization suggestions and alternative routes in JSON format.`;
    //
    //     try {
    //         const response = await this.openaiService.generateTour(optimizationPrompt);
    //         const parsed = JSON.parse(response);
    //         return {
    //             suggestions: parsed.suggestions || 'No specific optimizations needed',
    //             alternativeRoutes: parsed.alternativeRoutes || []
    //         };
    //     } catch (error) {
    //         return {
    //             suggestions: 'Unable to generate optimizations at this time',
    //             alternativeRoutes: []
    //         };
    //     }
    // }

    async generateVehicleAssignments(assignmentData: {
        participants: Array<{ name: string; preferences: any; mobility: number }>;
        vehicles: Array<{ type: string; capacity: number; features: string[] }>;
        destinations: string[];
    }): Promise<{ assignments: any[]; reasoning: string }> {
        const prompt = `Generate optimal vehicle assignments:
    
    PARTICIPANTS: ${JSON.stringify(assignmentData.participants, null, 2)}
    VEHICLES: ${JSON.stringify(assignmentData.vehicles, null, 2)}
    DESTINATIONS: ${assignmentData.destinations.join(', ')}
    
    Consider compatibility, mobility needs, preferences, and vehicle features.
    Provide assignments and reasoning in JSON format.`;

        try {
            const response = await this.openaiService.generatePersonalizedRecommendations(prompt);
            const parsed = JSON.parse(response);
            return {
                assignments: parsed.assignments || [],
                reasoning: parsed.reasoning || 'Standard assignment based on capacity'
            };
        } catch (error) {
            // Fallback logic for vehicle assignment
            const assignments = this.createFallbackAssignments(assignmentData);
            return {
                assignments,
                reasoning: 'Automatic assignment based on capacity and basic preferences'
            };
        }
    }

    async getTourAnalytics(tourId: string): Promise<{
        costAnalysis: any;
        timeAnalysis: any;
        efficiencyMetrics: any;
        suggestions: string[];
    }> {
        const tour = await this.getTourById(tourId);

        const costAnalysis = {
            totalBudget: tour.totalBudget,
            budgetBreakdown: tour.budgetBreakdown,
            costPerPerson: tour.totalBudget / tour.totalParticipants,
            costPerDay: tour.totalBudget / parseInt(tour.duration.split(' ')[0])
        };

        const timeAnalysis = {
            totalDuration: tour.duration,
            averageStopDuration: this.calculateAverageStopDuration(tour.itinerary),
            travelTime: this.calculateTotalTravelTime(tour.itinerary),
            activeTime: this.calculateActiveTime(tour.itinerary)
        };

        const efficiencyMetrics = {
            locationsPerDay: tour.itinerary.length / parseInt(tour.duration.split(' ')[0]),
            budgetEfficiency: this.calculateBudgetEfficiency(tour),
            timeEfficiency: this.calculateTimeEfficiency(tour),
            vehicleUtilization: this.calculateVehicleUtilization(tour)
        };

        const suggestions = this.generateEfficiencySuggestions(tour, efficiencyMetrics);

        return { costAnalysis, timeAnalysis, efficiencyMetrics, suggestions };
    }

    private createFallbackAssignments(assignmentData: any): any[] {
        const assignments = [];
        let currentVehicleIndex = 0;
        let currentVehicleOccupants = 0;

        assignmentData.participants.forEach((participant, index) => {
            if (currentVehicleOccupants >= assignmentData.vehicles[currentVehicleIndex].capacity) {
                currentVehicleIndex++;
                currentVehicleOccupants = 0;
            }

            assignments.push({
                participantName: participant.name,
                vehicleIndex: currentVehicleIndex,
                vehicleType: assignmentData.vehicles[currentVehicleIndex]?.type || 'Unknown',
                seatAssignment: currentVehicleOccupants + 1
            });

            currentVehicleOccupants++;
        });

        return assignments;
    }

    private calculateAverageStopDuration(itinerary: any[]): string {
        if (!itinerary.length) return '0 hours';
        const totalMinutes = itinerary.reduce((sum, stop) => {
            const duration = parseFloat(stop.duration) || 1;
            return sum + duration * 60;
        }, 0);
        return `${Math.round(totalMinutes / itinerary.length / 60 * 10) / 10} hours`;
    }

    private calculateTotalTravelTime(itinerary: any[]): string {
        return `${itinerary.length * 0.5} hours estimated`;
    }

    private calculateActiveTime(itinerary: any[]): string {
        const activeHours = itinerary.reduce((sum, stop) => {
            return sum + (parseFloat(stop.duration) || 1);
        }, 0);
        return `${activeHours} hours`;
    }

    private calculateBudgetEfficiency(tour: Tour): number {
        if (!tour.totalBudget || !tour.totalParticipants) return 0;

        const costPerPersonPerDay = tour.totalBudget / (tour.totalParticipants * parseInt(tour.duration.split(' ')[0]));

        // Efficiency score based on cost per person per day (lower is better)
        // Scale: $100/day = 10/10, $500/day = 5/10, $1000+/day = 1/10
        if (costPerPersonPerDay <= 100) return 10;
        if (costPerPersonPerDay <= 200) return 9;
        if (costPerPersonPerDay <= 300) return 8;
        if (costPerPersonPerDay <= 400) return 7;
        if (costPerPersonPerDay <= 500) return 6;
        if (costPerPersonPerDay <= 700) return 4;
        if (costPerPersonPerDay <= 1000) return 2;
        return 1;
    }

    private calculateTimeEfficiency(tour: Tour): number {
        if (!tour.itinerary.length) return 0;

        const durationDays = parseInt(tour.duration.split(' ')[0]);
        const locationsPerDay = tour.itinerary.length / durationDays;

        // Optimal range: 3-5 locations per day
        if (locationsPerDay >= 3 && locationsPerDay <= 5) return 10;
        if (locationsPerDay >= 2 && locationsPerDay < 3) return 8;
        if (locationsPerDay > 5 && locationsPerDay <= 6) return 8;
        if (locationsPerDay >= 1 && locationsPerDay < 2) return 6;
        if (locationsPerDay > 6 && locationsPerDay <= 8) return 6;
        if (locationsPerDay > 8) return 3;
        return 1;
    }

    private calculateVehicleUtilization(tour: Tour): number {
        if (!tour.vehicleAssignments.length) return 0;

        let totalUtilization = 0;
        tour.vehicleAssignments.forEach(assignment => {
            const utilization = (assignment.occupants / 8) * 100; // Assuming max 8 capacity
            totalUtilization += Math.min(utilization, 100);
        });

        return Math.round(totalUtilization / tour.vehicleAssignments.length);
    }

    private generateEfficiencySuggestions(tour: Tour, metrics: any): string[] {
        const suggestions = [];

        if (metrics.budgetEfficiency < 6) {
            suggestions.push('Consider reducing accommodation costs or finding group discounts');
            suggestions.push('Look for free activities and attractions');
        }

        if (metrics.timeEfficiency < 6) {
            if (metrics.locationsPerDay > 6) {
                suggestions.push('Reduce the number of locations per day for a more relaxed pace');
            } else {
                suggestions.push('Add more activities to make better use of your time');
            }
        }

        if (metrics.vehicleUtilization < 70) {
            suggestions.push('Consider consolidating to fewer vehicles to reduce costs');
        }

        if (suggestions.length === 0) {
            suggestions.push('Your tour is well-optimized!');
            suggestions.push('Consider adding backup activities for bad weather');
        }

        return suggestions;
    }

    // Additional utility methods for enhanced functionality

    async suggestAlternativeLocations(tourId: string, location: string): Promise<string[]> {
        const tour = await this.getTourById(tourId);
        const prompt = `Based on this tour in ${tour.destination}, suggest 5 alternative locations to ${location} that would fit the same time slot and tour theme. Consider the tour type: ${tour.title}`;

        try {
            const response = await this.openaiService.getLocationInfo(prompt);
            // Parse response to extract location names
            const alternatives = response.split('\n')
                .filter(line => line.trim())
                .slice(0, 5)
                .map(line => line.replace(/^\d+\.\s*/, '').trim());
            return alternatives;
        } catch (error) {
            return ['Alternative location suggestions unavailable'];
        }
    }

    async estimateWeatherImpact(tourId: string, weatherConditions: any): Promise<{
        affectedActivities: string[];
        alternatives: string[];
        recommendations: string[];
    }> {
        const tour = await this.getTourById(tourId);
        const outdoorActivities = tour.itinerary.filter(item =>
            item.description.toLowerCase().includes('outdoor') ||
            item.description.toLowerCase().includes('park') ||
            item.location.toLowerCase().includes('garden')
        );

        return {
            affectedActivities: outdoorActivities.map(a => a.location),
            alternatives: ['Indoor museums', 'Shopping centers', 'Cultural centers'],
            recommendations: [
                'Check weather forecast daily',
                'Have indoor backup plans',
                'Bring appropriate weather gear'
            ]
        };
    }

    async generateTourSummary(tourId: string): Promise<{
        overview: string;
        keyHighlights: string[];
        logisticsOverview: string;
        budgetSummary: string;
    }> {
        const tour = await this.getTourById(tourId);

        return {
            overview: `${tour.duration} ${tour.title} in ${tour.destination} for ${tour.totalParticipants} participants`,
            keyHighlights: tour.highlights,
            logisticsOverview: `${tour.vehicleAssignments.length} vehicles coordinated across ${tour.itinerary.length} locations`,
            budgetSummary: `Total budget: ${tour.totalBudget} (${Math.round(tour.totalBudget / tour.totalParticipants)} per person)`
        };
    }

    private validateVehicleConfiguration(dto: CreateTourDto): void {
        if (!dto.vehicles || dto.vehicles.length === 0) {
            throw new Error('At least one vehicle configuration is required');
        }

        const totalCapacity = dto.vehicles.reduce((sum, v) => sum + v.capacity, 0);
        const totalOccupants = dto.vehicles.reduce((sum, v) => sum + v.occupants, 0);

        if (totalOccupants > totalCapacity) {
            throw new Error('Total occupants exceed total vehicle capacity');
        }

        dto.vehicles.forEach((vehicle, index) => {
            if (vehicle.occupants > vehicle.capacity) {
                throw new Error(`Vehicle ${index + 1}: Occupants (${vehicle.occupants}) exceed capacity (${vehicle.capacity})`);
            }
        });

        // Validate location preferences
        if (dto.locationPreferences) {
            dto.locationPreferences.forEach((location, index) => {
                if (location.minTime > location.maxTime) {
                    throw new Error(`Location ${index + 1} (${location.name}): Minimum time cannot exceed maximum time`);
                }
            });
        }
    }

    async getTourById(id: string): Promise<Tour> {
        const tour = this.tours.find(t => t.id === id);
        if (!tour) {
            throw new NotFoundException(`Tour with ID ${id} not found`);
        }
        return tour;
    }

    async getAllTours(): Promise<Tour[]> {
        return this.tours;
    }

    async getLocationInfo(location: string): Promise<string> {
        return this.openaiService.getLocationInfo(location);
    }

    async getPersonalizedRecommendations(preferences: TourPreferencesDto): Promise<string> {
        return this.openaiService.generatePersonalizedRecommendations(preferences);
    }

    async updateTour(id: string, updates: Partial<CreateTourDto>): Promise<Tour> {
        const tourIndex = this.tours.findIndex(t => t.id === id);
        if (tourIndex === -1) {
            throw new NotFoundException(`Tour with ID ${id} not found`);
        }

        if (updates.primaryRegion || updates.tourType) {
            // Regenerate tour with new parameters
            const prompt = this.buildTourPrompt({ ...this.tours[tourIndex], ...updates } as CreateTourDto);
            const aiResponse = await this.openaiService.generateTour(prompt);
            const tourData = this.parseAIResponse(aiResponse);

            this.tours[tourIndex] = <Tour>{
                ...this.tours[tourIndex],
                ...tourData,
                ...updates,
            };
        } else {
            this.tours[tourIndex] = <Tour>{...this.tours[tourIndex], ...updates};
        }

        return this.tours[tourIndex];
    }

    async deleteTour(id: string): Promise<void> {
        const tourIndex = this.tours.findIndex(t => t.id === id);
        if (tourIndex === -1) {
            throw new NotFoundException(`Tour with ID ${id} not found`);
        }
        this.tours.splice(tourIndex, 1);
    }



    // private buildTourPrompt(dto: CreateTourDto): string {
    //     const totalParticipants = dto.vehicles.reduce((sum, v) => sum + v.occupants, 0);
    //     const vehicleDetails = dto.vehicles.map(v =>
    //         `${v.type} (${v.occupants}/${v.capacity} people, driver ${v.driverIncluded ? 'included' : 'not included'})`
    //     ).join(', ');
    //
    //     const locationPriorities = dto.locationPreferences
    //         .sort((a, b) => b.priority - a.priority)
    //         .map(l => `${l.name} (Priority: ${l.priority}/10, Time: ${l.minTime}-${l.maxTime}h)`)
    //         .join(', ');
    //
    //     const configDetails = `
    // Mobility Level: ${dto.configuration.mobilityLevel}/10 (1=limited, 10=very active)
    // Pace: ${dto.configuration.pacePreference}/10 (1=relaxed, 10=packed)
    // Cultural Immersion: ${dto.configuration.culturalImmersion}/10
    // Photography Focus: ${dto.configuration.photographyFocus}/10
    // Food Adventure: ${dto.configuration.foodAdventure}/10
    // Budget Flexibility: ${dto.configuration.budgetFlexibility}/10`;
    //
    //     return `Create a comprehensive ${dto.duration}-day ${dto.tourType} tour for ${dto.destination}.
    //
    // GROUP & LOGISTICS:
    // - Total participants: ${totalParticipants} people
    // - Vehicles: ${vehicleDetails}
    // - Budget: ${dto.budget} USD
    // - Starting location: ${dto.startingLocation || 'City center'}
    // ${dto.accommodationType ? `- Accommodation type: ${dto.accommodationType}` : ''}
    //
    // LOCATION PRIORITIES:
    // ${locationPriorities}
    //
    // CONFIGURATION:${configDetails}
    //
    // ${dto.interests?.length ? `INTERESTS: ${dto.interests.join(', ')}` : ''}
    // ${dto.ageRange ? `AGE RANGE: ${dto.ageRange}` : ''}
    // ${dto.dietaryRequirements?.length ? `DIETARY: ${dto.dietaryRequirements.join(', ')}` : ''}
    // ${dto.accessibilityRequirements ? `ACCESSIBILITY: ${dto.accessibilityRequirements}` : ''}
    // ${dto.languagePreferences?.length ? `LANGUAGES: ${dto.languagePreferences.join(', ')}` : ''}
    // ${dto.specialRequirements ? `SPECIAL REQUIREMENTS: ${dto.specialRequirements}` : ''}
    //
    // RESPONSE FORMAT (JSON):
    // {
    //   "title": "Tour name",
    //   "duration": "${dto.duration} days",
    //   "difficulty": "Easy/Medium/Hard",
    //   "highlights": ["main attractions"],
    //   "itinerary": [
    //     {
    //       "time": "09:00",
    //       "location": "Location name",
    //       "description": "Detailed description",
    //       "tips": ["practical tips"],
    //       "duration": "2 hours",
    //       "vehicleInstructions": "Vehicle coordination details",
    //       "groupDistribution": "How to distribute groups if multiple vehicles",
    //       "estimatedCost": 50,
    //       "accessibility": "Accessibility info",
    //       "photoOpportunities": ["photo spots"]
    //     }
    //   ],
    //   "vehicleAssignments": [
    //     {
    //       "vehicleId": "vehicle_1",
    //       "vehicleType": "${dto.vehicles[0]?.type || 'sedan'}",
    //       "occupants": ${dto.vehicles[0]?.occupants || 4},
    //       "route": "Optimized route details",
    //       "parkingInstructions": "Where to park",
    //       "driverNotes": "Important notes for driver"
    //     }
    //   ],
    //   "recommendations": ["additional suggestions"],
    //   "totalBudget": ${dto.budget},
    //   "totalParticipants": ${totalParticipants},
    //   "budgetBreakdown": {
    //     "transportation": 0,
    //     "accommodation": 0,
    //     "meals": 0,
    //     "activities": 0,
    //     "miscellaneous": 0
    //   },
    //   "logisticsNotes": ["important logistics information"],
    //   "emergencyContacts": ["local emergency numbers"]
    // }
    //
    // Consider vehicle coordination, group management, budget optimization, and all slider preferences in your planning.`;
    // }


    private buildTourPrompt(dto: CreateTourDto): string {
        const totalParticipants = dto.vehicles.reduce((sum, v) => sum + v.occupants, 0);

        const vehicleDetails = dto.vehicles
            .map(v => {
                const equipment = v.specialEquipment?.length
                    ? ` (Equipment: ${v.specialEquipment.join(', ')})`
                    : '';
                return `${v.type} (${v.occupants}/${v.capacity} people, driver ${
                    v.driverIncluded ? 'included' : 'not included'
                }${equipment})`;
            })
            .join(', ');

        const locationPriorities = dto.locationPreferences
            .sort((a, b) => b.priority - a.priority)
            .map(l => {
                const altitudeInfo = l.altitude ? ` (${l.altitude}m altitude)` : '';
                const activities = l.activities?.length
                    ? ` - Activities: ${l.activities.join(', ')}`
                    : '';
                return `${l.name} in ${l.region || 'region'} (Priority: ${l.priority}/10, Time: ${l.minTime}-${l.maxTime}h${altitudeInfo})${activities}`;
            })
            .join(', ');

        const configDetails = `
    Mobility/Fitness Level: ${dto.configuration.mobilityLevel}/10 (1=limited mobility, 10=very fit for mountain activities)
    Adventure Level: ${dto.configuration.adventureLevel}/10 (1=comfort focused, 10=extreme adventure)
    Cultural Immersion: ${dto.configuration.culturalImmersion}/10 (nomadic culture, traditions)
    Nature/Wildlife Focus: ${dto.configuration.natureFocus}/10
    Traditional Experience: ${dto.configuration.traditionalExperience}/10 (yurt stays, horseback riding, traditional crafts)
    Budget Flexibility: ${dto.configuration.budgetFlexibility}/10`;

        const seasonalConsiderations = dto.season
            ? `
    SEASONAL FOCUS: ${dto.season} - Consider weather, accessibility, seasonal activities, and road conditions`
            : '';

        return `Create a comprehensive ${dto.duration}-day ${dto.tourType} tour in KYRGYZSTAN, focusing on ${dto.primaryRegion} region.

    KYRGYZSTAN TOUR LOGISTICS:
    - Total participants: ${totalParticipants} people
    - Transport: ${vehicleDetails}
    - Budget: ${dto.budget} USD
    - Starting point: ${dto.startingLocation || 'Bishkek'}
    ${dto.accommodationType ? `- Accommodation style: ${dto.accommodationType}` : ''}
    ${seasonalConsiderations}

    PRIORITY LOCATIONS IN KYRGYZSTAN:
    ${locationPriorities}

    TOUR CONFIGURATION:${configDetails}

    ${dto.interests?.length ? `CULTURAL INTERESTS: ${dto.interests.join(', ')}` : ''}
    ${dto.ageRange ? `GROUP AGE RANGE: ${dto.ageRange}` : ''}
    ${dto.dietaryRequirements?.length ? `DIETARY NEEDS: ${dto.dietaryRequirements.join(', ')}` : ''}
    ${dto.altitudeConcerns ? `ALTITUDE CONCERNS: ${dto.altitudeConcerns}` : ''}
    ${dto.languagePreferences?.length ? `PREFERRED LANGUAGES: ${dto.languagePreferences.join(', ')}` : ''}
    ${dto.traditionalActivities?.length ? `TRADITIONAL ACTIVITIES: ${dto.traditionalActivities.join(', ')}` : ''}
    ${dto.photographyInterests?.length ? `PHOTOGRAPHY FOCUS: ${dto.photographyInterests.join(', ')}` : ''}
    ${dto.specialRequirements ? `SPECIAL REQUIREMENTS: ${dto.specialRequirements}` : ''}

    KYRGYZSTAN-SPECIFIC CONSIDERATIONS:
    - Include authentic Kyrgyz experiences (yurt stays, traditional meals, horse trekking)
    - Consider mountain road conditions and accessibility
    - Include altitude acclimatization time if needed
    - Suggest local guides who speak preferred languages
    - Include traditional foods: beshbarmak, lagman, manti, kumys, etc.
    - Consider cultural etiquette and local customs
    - Include currency information (Kyrgyz som) and payment methods
    - Weather-appropriate activities for the season
    - Safety considerations for mountain/remote areas

    RESPONSE FORMAT (JSON):
    {
      "title": "Kyrgyzstan Tour name",
      "duration": "${dto.duration} days",
      "difficulty": "Easy/Medium/Hard (considering Kyrgyzstan terrain)",
      "highlights": ["key Kyrgyzstan attractions and experiences"],
      "itinerary": [
        {
          "time": "09:00",
          "location": "Kyrgyzstan location name",
          "description": "Detailed description with cultural context",
          "tips": ["practical tips for Kyrgyzstan travel"],
          "duration": "2 hours",
          "vehicleInstructions": "Transport coordination for Kyrgyzstan roads",
          "groupDistribution": "Group management for activities"
        }
      ]
    }
  `;
    }

    async optimizeTourRoute(
        tour: Tour,
        currentConditions: any,
        preferences: any
    ): Promise<{
        suggestions: string;
        alternativeRoutes: any[];
    }> {
        const optimizationPrompt = `Optimize this tour based on current conditions and preferences:
    
    CURRENT TOUR: ${JSON.stringify(tour, null, 2)}
    
    CURRENT CONDITIONS:
    - Weather: ${currentConditions.weather || 'Unknown'}
    - Traffic: ${currentConditions.traffic || 'Normal'}
    - Events: ${currentConditions.events || 'None'}
    - Time constraints: ${currentConditions.timeConstraints || 'None'}
    
    PREFERENCES:
    - Priority changes: ${preferences.priorityChanges || 'None'}
    - New constraints: ${preferences.newConstraints || 'None'}
    
    Provide optimization suggestions and alternative routes in JSON format.`;

        try {
            const response = await this.openaiService.generateTour(optimizationPrompt);
            const parsed = JSON.parse(response);
            return {
                suggestions: parsed.suggestions || 'No specific optimizations needed',
                alternativeRoutes: parsed.alternativeRoutes || []
            };
        } catch (error) {
            return {
                suggestions: 'Unable to generate optimizations at this time',
                alternativeRoutes: []
            };
        }
    }

    private parseAIResponse(response: string): Partial<Tour> {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(response);

            // Ensure all required vehicle assignments exist
            if (!parsed.vehicleAssignments) {
                parsed.vehicleAssignments = [];
            }

            // Ensure budget breakdown exists
            if (!parsed.budgetBreakdown) {
                parsed.budgetBreakdown = {
                    transportation: 0,
                    accommodation: 0,
                    meals: 0,
                    activities: 0,
                    miscellaneous: 0
                };
            }

            // Ensure logistics notes exist
            if (!parsed.logisticsNotes) {
                parsed.logisticsNotes = [];
            }

            return parsed;
        } catch (error) {
            // If not valid JSON, create structure from text
            return {
                title: 'Custom Tour',
                duration: 'Multi-day',
                difficulty: 'Medium',
                highlights: ['AI Generated Tour'],
                itinerary: [{
                    time: '09:00',
                    location: 'Starting Point',
                    description: response,
                    tips: ['Follow AI recommendations'],
                    duration: '1 day',
                    vehicleInstructions: 'Standard vehicle coordination',
                    groupDistribution: 'Even distribution across vehicles',
                    estimatedCost: 0,
                    accessibility: 'Standard accessibility',
                    photoOpportunities: ['Scenic viewpoints']
                }],
                vehicleAssignments: [],
                recommendations: ['Check local weather', 'Bring comfortable shoes'],
                totalBudget: 0,
                totalParticipants: 0,
                budgetBreakdown: {
                    transportation: 0,
                    accommodation: 0,
                    meals: 0,
                    activities: 0,
                    miscellaneous: 0
                },
                logisticsNotes: ['Basic tour logistics']
            };
        }
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
