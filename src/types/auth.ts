// ─── Auth DTOs matching the Spring Boot backend ───────────────

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  username: string
  fullName: string
  email: string
  role: string
}

export interface UserProfile {
  id: number
  username: string
  email: string
  fullName: string
  phoneNumber?: string
  address?: string
  department?: string
  position?: string
  role: string
  status: string
  createdAt: string
}

export interface UpdateProfileRequest {
  fullName: string
  phoneNumber?: string
  address?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ─── Generic API wrapper ──────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}
