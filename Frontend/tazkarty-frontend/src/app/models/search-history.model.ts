export interface SearchHistory {
  _id: string;
  user_id: string;
  query: string;
  filters?: any;
  results_count: number;
  createdAt: Date;
}
