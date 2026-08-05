// ─── Auth DTOs matching the Spring Boot backend ───────────────

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  id: number
  accessToken: string   // BE field is 'accessToken' not 'token'
  tokenType: string
  expiresIn: number
  username: string
  fullName: string
  role: string
}

/** Matches BE: UserProfileResponse */
export interface UserProfile {
  id: number
  username: string
  fullName: string
  email: string
  phone?: string        // BE field is 'phone' not 'phoneNumber'
  avatarUrl?: string
  dateOfBirth?: string  // "dd/MM/yyyy"
  gender?: string       // MALE | FEMALE | OTHER
  department?: string
  position?: string
  role: string
}

/** Matches BE: UpdateProfileRequest — email is @NotBlank so always required */
export interface UpdateProfileRequest {
  fullName: string
  email: string
  phone?: string
  dateOfBirth?: string  // "dd/MM/yyyy"
  gender?: string
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
// BE puts the success message in `message` and the failure reason in `error`
// (see ApiResponse.java) — both are omitted (not just empty) when unused.
export interface ApiResponse<T> {
  success: boolean
  message?: string
  error?: string
  data?: T
}
