import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Train {
    train_number: string;
    train_type: string;
    departure_time: string;
    arrival_time: string;
    duration: string;
    stops: number;
}

export interface TrainCarriage {
    number: number;
    class: string;
    rows: number;
    columns_per_row: number;
    layout_type: string;
    capacity: number;
    price: number;
}

export interface TrainAvailability {
    train_number: string;
    train_type: string;
    travel_date: string;
    layout: TrainCarriage[];
    occupied: Array<{ carriage: number; seat: string; status: string }>;
}

@Injectable({
    providedIn: 'root'
})
export class TrainsService {
    constructor(private api: ApiService) { }

    getTrainsByDestination(destination: string): Observable<Train[]> {
        return this.api.get<Train[]>(`trains/${destination}`);
    }

    getTrainAvailability(trainNumber: string, trainType: string, date: string): Observable<TrainAvailability> {
        return this.api.get<TrainAvailability>(`trains/seats/${trainNumber}`, { date, trainType });
    }

    createBooking(bookingData: any): Observable<any> {
        return this.api.post<any>('trains/book', bookingData);
    }
}
