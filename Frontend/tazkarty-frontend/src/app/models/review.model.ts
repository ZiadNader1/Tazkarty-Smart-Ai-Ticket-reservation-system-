import { User } from './user.model';

export interface Review {
  _id: string;
  user_id: string | User;
  event_id: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewRequest {
  user_id: string;
  event_id: string;
  rating: number;
  comment?: string;
}