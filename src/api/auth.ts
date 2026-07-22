import api from './axios'
import type {
  LoginRequest, LoginResponse,
  UserProfile, UpdateProfileRequest,
  ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest,
  ApiResponse,
} from '@/types/auth'

// ─── AUTH-001: Login ──────────────────────────────────────────
export const login = (data: LoginRequest) =>
  api.post<ApiResponse<LoginResponse>>('/auth/login', data)

// ─── AUTH-002: Forgot Password ────────────────────────────────
export const forgotPassword = (data: ForgotPasswordRequest) =>
  api.post<ApiResponse<null>>('/auth/forgot-password', data)

// ─── AUTH-003: Reset Password ─────────────────────────────────
export const resetPassword = (data: ResetPasswordRequest) =>
  api.post<ApiResponse<null>>('/auth/reset-password', data)

// ─── AUTH-004: Get My Profile ─────────────────────────────────
export const getMyProfile = () =>
  api.get<ApiResponse<UserProfile>>('/users/me')

// ─── AUTH-004: Update My Profile ─────────────────────────────
export const updateMyProfile = (data: UpdateProfileRequest) =>
  api.put<ApiResponse<UserProfile>>('/users/me', data)

// ─── AUTH-005: Change Password ────────────────────────────────
export const changePassword = (data: ChangePasswordRequest) =>
  api.put<ApiResponse<null>>('/users/me/change-password', data)
