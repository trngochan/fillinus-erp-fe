import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, UserPlus, Loader2, Shield } from 'lucide-react'
import { register as registerApi } from '@/api/sales'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  fullName:        z.string().min(1, 'Full name is required'),
  username:        z.string().min(3, 'Username must be at least 3 characters'),
  email:           z.string().email('Invalid email address'),
  password:        z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate   = useNavigate()
  const { login }  = useAuthStore()
  const [showPw, setShowPw]     = useState(false)
  const [showCPw, setShowCPw]   = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setApiError('')
    try {
      const res = await registerApi({
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        email:    data.email,
      })
      if (res.data.success && res.data.data) {
        login(res.data.data)
        navigate('/sales')
      } else {
        setApiError(res.data.message || 'Registration failed')
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setApiError(msg || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-600/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FILLINUS ERP</h1>
          <p className="text-slate-400 mt-1 text-sm">Create your Sales account</p>
        </div>

        {/* Card */}
        <div className="auth-card p-8">
          <h2 className="text-xl font-semibold text-white mb-1">Create Account</h2>
          <p className="text-slate-400 text-sm mb-6">Register as a Sales Representative</p>

          {apiError && <div className="alert-error mb-4">{apiError}</div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="form-label">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Your full name"
                className={`input-field ${errors.fullName ? 'error' : ''}`}
                {...register('fullName')}
              />
              {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="reg-username" className="form-label">Username</label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                className={`input-field ${errors.username ? 'error' : ''}`}
                {...register('username')}
              />
              {errors.username && <p className="form-error">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="form-label">Email</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                className={`input-field ${errors.email ? 'error' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="form-label">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  className={`input-field pr-12 ${errors.password ? 'error' : ''}`}
                  {...register('password')}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showCPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className={`input-field pr-12 ${errors.confirmPassword ? 'error' : ''}`}
                  {...register('confirmPassword')}
                />
                <button type="button" onClick={() => setShowCPw(!showCPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors">
                  {showCPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
            </div>

            {/* Role badge */}
            <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-lg px-3 py-2">
              <UserPlus className="w-4 h-4 text-brand-400 shrink-0" />
              <span className="text-sm text-slate-300">You will be registered as a <span className="text-brand-400 font-semibold">Sales Representative</span></span>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isSubmitting} className="btn-primary mt-2">
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                : <><UserPlus className="w-4 h-4" /> Create Account</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>

        <p className="text-center text-slate-500 text-xs mt-4">
          © 2024 FILLINUS Entertainment. All rights reserved.
        </p>
      </div>
    </div>
  )
}
