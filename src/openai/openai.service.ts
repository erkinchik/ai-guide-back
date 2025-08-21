import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
    private openai: OpenAI;

    constructor(private configService: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        });
    }

    async generateTour(prompt: string): Promise<string> {
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert tour guide AI agent. Create detailed, engaging tour itineraries based on user preferences. 
            Include specific locations, timing, descriptions, and helpful tips. Format your response as a structured JSON with:
            - title: Tour name
            - duration: Total duration
            - difficulty: Easy/Medium/Hard
            - highlights: Array of main attractions
            - itinerary: Array of stops with time, location, description, tips
            - recommendations: Additional suggestions`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }

    async getLocationInfo(location: string): Promise<string> {
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a knowledgeable travel expert. Provide detailed information about locations including history, culture, best times to visit, and insider tips.'
                    },
                    {
                        role: 'user',
                        content: `Tell me about ${location} as a travel destination.`
                    }
                ],
                max_tokens: 1000,
                temperature: 0.6,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }

    async generatePersonalizedRecommendations(preferences: any): Promise<string> {
        const prompt = `Based on these preferences, suggest personalized travel recommendations:
    - Budget: ${preferences.budget}
    - Interests: ${preferences.interests?.join(', ')}
    - Travel style: ${preferences.travelStyle}
    - Duration: ${preferences.duration}
    - Group size: ${preferences.groupSize}`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a personalized travel advisor. Create tailored recommendations based on user preferences.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.8,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }
}
