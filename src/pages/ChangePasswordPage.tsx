import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { changePassword } from '@/api/auth'

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
})
type FormData = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setApiError('')
    try {
      const res = await changePassword(data)
      if (res.data.success) {
        setSuccess(true)
        reset()
      } else {
        setApiError(res.data.message || 'Failed to change password')
      }
    } catch {
      setApiError('Current password is incorrect or request failed.')
    }
  }

  const toggle = (field: keyof typeof show) =>
    setShow(prev => ({ ...prev, [field]: !prev[field] }))

  return (
    <div>
      <div className="border-b border-white/5 bg-slate-900/50 px-4 py-4 flex items-center gap-3">
        <Link to="/profile" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-white font-semibold">Change Password</span>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="auth-card p-8">
          {success ? (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Password changed!</h2>
              <p className="text-slate-400 text-sm mb-6">Your password has been updated successfully.</p>
              <Link to="/profile" className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-2.5 w-auto">
                <ArrowLeft className="w-4 h-4" /> Back to Profile
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Change Password</h2>
                  <p className="text-slate-400 text-sm">Keep your account secure</p>
                </div>
              </div>

              {apiError && <div className="alert-error mb-5">{apiError}</div>}

              {/* Password rules */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-xs text-slate-400 space-y-1">
                <p className="text-slate-300 font-medium mb-2">Password requirements:</p>
                <p>• At least 8 characters</p>
                <p>• At least one uppercase letter (A–Z)</p>
                <p>• At least one number (0–9)</p>
                <p>• Different from your current password</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Current password */}
                <div>
                  <label htmlFor="currentPassword" className="form-label">Current Password</label>
                  <div className="relative">
                    <input id="currentPassword"
                      type={show.current ? 'text' : 'password'}
                      placeholder="Enter current password"
                      className={`input-field pr-12 ${errors.currentPassword ? 'error' : ''}`}
                      {...register('currentPassword')} />
                    <button type="button" onClick={() => toggle('current')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                      {show.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.currentPassword && <p className="form-error">{errors.currentPassword.message}</p>}
                </div>

                {/* New password */}
                <div>
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <div className="relative">
                    <input id="newPassword"
                      type={show.new ? 'text' : 'password'}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      className={`input-field pr-12 ${errors.newPassword ? 'error' : ''}`}
                      {...register('newPassword')} />
                    <button type="button" onClick={() => toggle('new')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                      {show.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                  <div className="relative">
                    <input id="confirmPassword"
                      type={show.confirm ? 'text' : 'password'}
                      placeholder="Repeat new password"
                      className={`input-field pr-12 ${errors.confirmPassword ? 'error' : ''}`}
                      {...register('confirmPassword')} />
                    <button type="button" onClick={() => toggle('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
                      {show.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <Link to="/profile" className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    Cancel
                  </Link>
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                    {isSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                      : <><KeyRound className="w-4 h-4" /> Update Password</>
                    }
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
