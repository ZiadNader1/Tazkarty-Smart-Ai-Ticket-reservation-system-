
export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'editor';
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  message: string;
  token: string;
  admin?: Admin;
}