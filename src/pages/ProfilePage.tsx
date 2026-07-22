import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { User, Mail, Phone, Briefcase, Building2, Loader2, Save, KeyRound, LogOut } from 'lucide-react'
import { getMyProfile, updateMyProfile } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import type { UserProfile } from '@/types/auth'

const schema = z.object({
  fullName:    z.string().min(1, 'Full name is required'),
  email:       z.string().email('Invalid email format'),
  phone:       z.string().optional(),
  gender:      z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
})
type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState('')
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    getMyProfile()
      .then(res => {
        if (res.data.data) {
          const p = res.data.data
          setProfile(p)
          reset({
            fullName: p.fullName,
            email:    p.email,
            phone:    p.phone ?? '',
            gender:   (p.gender as 'MALE' | 'FEMALE' | 'OTHER' | '') ?? '',
          })
        }
      })
      .catch(() => setApiError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (data: FormData) => {
    setApiError('')
    setSuccess('')
    try {
      const res = await updateMyProfile({
        fullName: data.fullName,
        email:    data.email,
        phone:    data.phone || undefined,
        gender:   data.gender || undefined,
      })
      if (res.data.success && res.data.data) {
        setProfile(res.data.data)
        updateUser({ fullName: res.data.data.fullName })
        reset(data)
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setApiError(res.data.message || 'Update failed')
      }
    } catch {
      setApiError('Failed to update profile')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top Nav */}
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-white font-semibold">FILLINUS ERP</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">
              {user?.fullName ?? user?.username}
            </span>
            <button onClick={logout}
              className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-slate-400 mt-1">Manage your personal information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Avatar Card */}
          <div className="auth-card p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-brand-600/20 border-2 border-brand-500/40 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-brand-400">
                {(profile?.fullName ?? user?.username ?? 'U')[0].toUpperCase()}
              </span>
            </div>
            <h3 className="text-white font-semibold text-lg">{profile?.fullName}</h3>
            <p className="text-slate-400 text-sm">@{profile?.username}</p>
            <div className="mt-3 px-3 py-1 bg-brand-600/20 text-brand-300 text-xs font-medium rounded-full border border-brand-500/30">
              {profile?.role}
            </div>

            <div className="w-full mt-6 space-y-3 text-left">
              {profile?.department && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span>{profile.department}</span>
                </div>
              )}
              {profile?.position && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Briefcase className="w-4 h-4 flex-shrink-0" />
                  <span>{profile.position}</span>
                </div>
              )}
            </div>

            <div className="w-full mt-6 pt-6 border-t border-white/5">
              <Link to="/profile/change-password"
                className="flex items-center justify-center gap-2 text-brand-400 hover:text-brand-300 text-sm transition-colors">
                <KeyRound className="w-4 h-4" /> Change Password
              </Link>
            </div>
          </div>

          {/* Right — Edit Form */}
          <div className="auth-card p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-6">Edit Information</h2>

            {success && <div className="alert-success mb-4">{success}</div>}
            {apiError && <div className="alert-error mb-4">{apiError}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Read-only username */}
              <div>
                <label className="form-label">Username</label>
                <div className="input-field flex items-center gap-2 opacity-50 cursor-not-allowed">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{profile?.username}</span>
                </div>
              </div>

              {/* Editable fields */}
              <div>
                <label htmlFor="fullName" className="form-label">Full Name <span className="text-red-400">*</span></label>
                <input id="fullName" type="text" placeholder="Your full name"
                  className={`input-field ${errors.fullName ? 'error' : ''}`}
                  {...register('fullName')} />
                {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="form-label">Email <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input id="email" type="email" placeholder="your@email.com"
                    className={`input-field pl-11 ${errors.email ? 'error' : ''}`}
                    {...register('email')} />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <div className="relative">
                  <input id="phone" type="tel" placeholder="+84 xxx xxx xxxx"
                    className="input-field pl-11"
                    {...register('phone')} />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="gender" className="form-label">Gender</label>
                <select id="gender" className="input-field" {...register('gender')}>
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting || !isDirty}
                  className="btn-primary w-auto px-8">
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    : <><Save className="w-4 h-4" /> Save Changes</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
