import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum KyrgyzstanRegion {
    BISHKEK_CHUY = 'bishkek_chuy',
    ISSYK_KUL = 'issyk_kul',
    NARYN = 'naryn',
    TALAS = 'talas',
    OSH_FERGHANA = 'osh_ferghana',
    JALAL_ABAD = 'jalal_abad',
    BATKEN = 'batken',
}

export enum TourType {
    CULTURAL = 'cultural',
    ADVENTURE = 'adventure',
    NOMADIC_EXPERIENCE = 'nomadic_experience',
    MOUNTAIN_TREKKING = 'mountain_trekking',
    HISTORICAL = 'historical',
    NATURE_WILDLIFE = 'nature_wildlife',
    SILK_ROAD = 'silk_road',
    PHOTOGRAPHY = 'photography',
    WINTER_SPORTS = 'winter_sports',
    CULINARY = 'culinary',
}

export enum VehicleType {
    SEDAN = 'sedan',
    SUV_4WD = 'suv_4wd',
    MINIVAN = 'minivan',
    MARSHRUTKA = 'marshrutka',
    HORSES = 'horses',
    HIKING = 'hiking',
    JEEP_OFFROAD = 'jeep_offroad',
}

export enum AccommodationType {
    HOTEL = 'hotel',
    GUESTHOUSE = 'guesthouse',
    YURT_CAMP = 'yurt_camp',
    TRADITIONAL_HOMESTAY = 'traditional_homestay',
    MOUNTAIN_LODGE = 'mountain_lodge',
    CAMPING = 'camping',
}

export class VehicleConfigDto {
    @ApiProperty({ description: 'Type of vehicle/transport', enum: VehicleType })
    @IsEnum(VehicleType)
    type: VehicleType;

    @ApiProperty({ description: 'Number of people using this transport', minimum: 1, maximum: 25 })
    @IsNumber()
    @Min(1)
    @Max(25)
    occupants: number;

    @ApiProperty({ description: 'Transport capacity', minimum: 1, maximum: 25 })
    @IsNumber()
    @Min(1)
    @Max(25)
    capacity: number;

    @ApiProperty({ description: 'Driver/guide included', required: false })
    @IsOptional()
    driverIncluded?: boolean;

    @ApiProperty({ description: 'Special equipment needed (GPS, satellite phone, etc.)', required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    specialEquipment?: string[];
}

export class LocationPreferenceDto {
    @ApiProperty({ description: 'Location name in Kyrgyzstan' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Region in Kyrgyzstan', enum: KyrgyzstanRegion, required: false })
    @IsOptional()
    @IsEnum(KyrgyzstanRegion)
    region?: KyrgyzstanRegion;

    @ApiProperty({ description: 'Priority level (1-10)', minimum: 1, maximum: 10 })
    @IsNumber()
    @Min(1)
    @Max(10)
    priority: number;

    @ApiProperty({ description: 'Minimum time to spend (in hours)', minimum: 0.5, maximum: 72 })
    @IsNumber()
    @Min(0.5)
    @Max(72)
    minTime: number;

    @ApiProperty({ description: 'Maximum time to spend (in hours)', minimum: 0.5, maximum: 72 })
    @IsNumber()
    @Min(0.5)
    @Max(72)
    maxTime: number;

    @ApiProperty({ description: 'Altitude level (meters above sea level)', required: false })
    @IsOptional()
    @IsNumber()
    altitude?: number;

    @ApiProperty({ description: 'Specific activities at this location', required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    activities?: string[];
}

export class TourConfigurationDto {
    @ApiProperty({ description: 'Group fitness/mobility level (1-10, 1=limited mobility, 10=very fit)', minimum: 1, maximum: 10 })
    @IsNumber()
    @Min(1)
    @Max(10)
    mobilityLevel: number;

    @ApiProperty({ description: 'Adventure level (1-10, 1=comfort focused, 10=extreme adventure)', minimum: 1, maximum: 10 })
    @IsNumber()
    @Min(1)
    @Max(10)
    adventureLevel: number;

    @ApiProperty({ description: 'Cultural immersion level (1-10)', minimum: 1, maximum: 10 })
    @IsNumber()
    @Min(1)
    @Max(10)
    culturalImmersion: number;

    @ApiProperty({ description: 'Nature/wildlife focus (1-10)', minimum: 1, maximum: 10 })
    @IsNumber()
    @Min(1)
    @Max(10)
    natureFocus: number;

    @ApiProperty({ description: 'Traditional experience level (1-10, nomadic lifestyle, yurt stays)', minimum: 1, maximum: 10 })
    @IsNumber()
    @Min(1)
    @Max(10)
    traditionalExperience: number;

    @ApiProperty({ description: 'Budget flexibility (1-10)', minimum: 1, maximum: 10 })
    @IsNumber()
    @Min(1)
    @Max(10)
    budgetFlexibility: number;
}
export class CreateTourDto {
    @ApiProperty({ description: 'Primary region in Kyrgyzstan', enum: KyrgyzstanRegion })
    @IsEnum(KyrgyzstanRegion)
    primaryRegion: KyrgyzstanRegion;

    @ApiProperty({ description: 'Number of days for the tour', minimum: 1, maximum: 30 })
    @IsNumber()
    @Min(1)
    @Max(30)
    duration: number;

    @ApiProperty({
        description: 'Type of Kyrgyzstan tour',
        enum: TourType,
        enumName: 'TourType'
    })
    @IsEnum(TourType)
    tourType: TourType;

    @ApiProperty({ description: 'Total budget in USD', minimum: 200, maximum: 20000 })
    @IsNumber()
    @Min(200)
    @Max(20000)
    budget: number;

    @ApiProperty({ description: 'Vehicle/transport configurations', type: [VehicleConfigDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VehicleConfigDto)
    vehicles: VehicleConfigDto[];

    @ApiProperty({ description: 'Specific location preferences in Kyrgyzstan', type: [LocationPreferenceDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LocationPreferenceDto)
    locationPreferences: LocationPreferenceDto[];

    @ApiProperty({ description: 'Tour configuration sliders' })
    @ValidateNested()
    @Type(() => TourConfigurationDto)
    configuration: TourConfigurationDto;

    @ApiProperty({ description: 'Preferred accommodation type', enum: AccommodationType, required: false })
    @IsOptional()
    @IsEnum(AccommodationType)
    accommodationType?: AccommodationType;

    @ApiProperty({ description: 'Starting city (Bishkek, Osh, or other)', required: false })
    @IsOptional()
    @IsString()
    startingLocation?: string;

    @ApiProperty({ description: 'Travel season preference', required: false })
    @IsOptional()
    @IsString()
    season?: string;

    @ApiProperty({ description: 'Specific interests in Kyrgyz culture/activities', type: [String], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    interests?: string[];

    @ApiProperty({ description: 'Age range of group members', required: false })
    @IsOptional()
    @IsString()
    ageRange?: string;

    @ApiProperty({ description: 'Dietary requirements (halal, vegetarian, etc.)', required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    dietaryRequirements?: string[];

    @ApiProperty({ description: 'Language preferences (English, Russian, Kyrgyz)', required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languagePreferences?: string[];

    @ApiProperty({ description: 'Altitude sensitivity or medical considerations', required: false })
    @IsOptional()
    @IsString()
    altitudeConcerns?: string;

    @ApiProperty({ description: 'Traditional activities interest (horse riding, felt making, etc.)', required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    traditionalActivities?: string[];

    @ApiProperty({ description: 'Photography focus areas', required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    photographyInterests?: string[];

    @ApiProperty({ description: 'Additional special requirements', required: false })
    @IsOptional()
    @IsString()
    specialRequirements?: string;
}
