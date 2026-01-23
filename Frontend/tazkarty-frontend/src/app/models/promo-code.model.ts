export interface PromoCode {
  _id: string;
  code: string;
  discount_percentage: number;
  max_uses: number;
  used_count: number;
  valid_from: Date;
  valid_to: Date;
  is_active: boolean;
  applicable_events?: string[];
  applicable_users?: string[];
}

export interface ApplyPromoCodeRequest {
  code: string;
}

export interface ApplyPromoCodeResponse {
  discount_percentage: number;
  promo_id: string;
}