export interface Venue {
    _id: string;
    name: string;
    location: string;
    capacity?: number;
    image?: string;
    description?: string;
    is_active: boolean;
    halls?: any[];
    createdAt?: Date;
    updatedAt?: Date;
}
