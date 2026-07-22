import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, Shield, CheckCircle } from 'lucide-react'
import { forgotPassword } from '@/api/auth'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setApiError('')
    try {
      const res = await forgotPassword(data)
      if (res.data.success) {
        setSuccess(true)
      } else {
        setApiError(res.data.message || 'Something went wrong')
      }
    } catch {
      setApiError('Failed to send reset email. Please try again.')
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
        </div>

        <div className="auth-card p-8">
          {success ? (
            /* Success state */
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm mb-2">
                We've sent a password reset link to
              </p>
              <p className="text-brand-400 font-medium text-sm mb-6">{getValues('email')}</p>
              <p className="text-slate-500 text-xs mb-6">
                The link expires in 30 minutes. Check your spam folder if you don't see it.
              </p>
              <Link to="/login" className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-2.5 w-auto">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <Link to="/login" className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-300 text-sm mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
              <h2 className="text-xl font-semibold text-white mb-1">Forgot password?</h2>
              <p className="text-slate-400 text-sm mb-6">
                Enter your email and we'll send you a reset link.
              </p>

              {apiError && <div className="alert-error mb-4">{apiError}</div>}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label htmlFor="email" className="form-label">Email address</label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="your@email.com"
                      className={`input-field pl-11 ${errors.email ? 'error' : ''}`}
                      {...register('email')}
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                    : <><Mail className="w-4 h-4" /> Send Reset Link</>
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
