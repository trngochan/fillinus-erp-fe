import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Loader2, Shield, CheckCircle } from 'lucide-react'
import { resetPassword } from '@/api/auth'

const schema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (!token) {
    return (
      <div className="min-h-screen bg-auth-gradient flex items-center justify-center p-4">
        <div className="auth-card p-8 max-w-md w-full text-center">
          <p className="text-red-400">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="btn-ghost mt-4 inline-block">Request a new link</Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    setApiError('')
    try {
      const res = await resetPassword({ token, ...data })
      if (res.data.success) {
        setSuccess(true)
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setApiError(res.data.message || 'Reset failed')
      }
    } catch {
      setApiError('Link may have expired. Please request a new one.')
    }
  }

  return (
    <div className="min-h-screen bg-auth-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-600/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">FILLINUS ERP</h1>
        </div>

        <div className="auth-card p-8">
          {success ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Password reset!</h2>
              <p className="text-slate-400 text-sm">Redirecting you to login in 3 seconds...</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-1">Set new password</h2>
              <p className="text-slate-400 text-sm mb-6">Choose a strong password for your account.</p>

              {apiError && <div className="alert-error mb-4">{apiError}</div>}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      className={`input-field pr-12 ${errors.newPassword ? 'error' : ''}`}
                      {...register('newPassword')}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                      {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat your new password"
                      className={`input-field pr-12 ${errors.confirmPassword ? 'error' : ''}`}
                      {...register('confirmPassword')}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
                    : <><KeyRound className="w-4 h-4" /> Reset Password</>
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
