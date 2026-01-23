
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user?: User;
}