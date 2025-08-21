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
