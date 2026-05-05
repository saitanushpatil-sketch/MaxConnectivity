import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import { authAPI } from '../utils/api';
import { disconnectSocket } from '../hooks/useSocket';
import Avatar from '../components/ui/Avatar';

const BADGE_META = {
  week_streak: { emoji: '🔥', label: '7 Day Streak' },
  month_streak: { emoji: '⚡', label: '30 Day Streak' },
  meme_lord: { emoji: '👑', label: 'Meme Lord (100 memes)' },
};

const AVATAR_COLORS = ['#00F5FF', '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06D6A0'];

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser, isAuthenticated, isLoading } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: user?.displayName || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);

  if (isLoading) return <div className="min-h-screen bg-max-bg flex items-center justify-center"><div className="w-8 h-8 border-2 border-max-cyan border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated || !user) { router.replace('/login'); return null; }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(form);
      updateUser(data.user);
      toast.success('Profile updated! ✨');
      setEditing(false);
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = async (color) => {
    try {
      const { data } = await authAPI.updateProfile({ avatarColor: color });
      updateUser(data.user);
      toast.success('Color updated!');
    } catch {}
  };

  const handleLogout = () => {
    disconnectSocket();
    logout();
    router.push('/login');
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-max-bg max-w-md mx-auto pb-20">
      {/* Header */}
      <div className="bg-max-surface border-b border-max-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-max-card rounded-lg">
          <span className="text-max-muted text-lg">←</span>
        </button>
        <h1 className="text-max-text font-semibold font-display flex-1">Profile</h1>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-max-cyan text-sm font-medium">Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-max-muted text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="text-max-cyan text-sm font-medium">
              {saving ? '...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Avatar section */}
        <div className="flex flex-col items-center gap-4">
          <Avatar user={user} size="xl" />
          {editing && (
            <div>
              <p className="text-max-muted text-xs text-center mb-2">Choose avatar color</p>
              <div className="flex gap-2">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-8 h-8 rounded-full transition-transform active:scale-95 ${user.avatarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-max-bg scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
          {!editing && (
            <div className="text-center">
              <h2 className="text-max-text font-bold text-xl font-display">{user.displayName}</h2>
              <p className="text-max-muted text-sm">@{user.username}</p>
              {user.bio && <p className="text-max-muted text-sm mt-1">{user.bio}</p>}
            </div>
          )}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="space-y-3 max-card p-4">
            <div>
              <label className="block text-xs text-max-muted mb-1">Display Name</label>
              <input type="text" value={form.displayName} onChange={set('displayName')} className="max-input" maxLength={40} />
            </div>
            <div>
              <label className="block text-xs text-max-muted mb-1">Bio</label>
              <textarea value={form.bio} onChange={set('bio')} className="max-input resize-none" rows={3} maxLength={150} placeholder="Tell people about yourself..." />
              <p className="text-[10px] text-max-muted text-right mt-1">{form.bio.length}/150</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="max-card p-4">
          <h3 className="text-max-text font-semibold text-sm mb-3">Stats</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Memes Sent', value: user.totalMemesSent || 0, icon: '🎭' },
              { label: 'Day Streak', value: user.streak || 0, icon: '🔥' },
              { label: 'Reactions', value: user.totalReactionsReceived || 0, icon: '⚡' },
            ].map(stat => (
              <div key={stat.label} className="bg-max-surface rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-max-cyan font-bold text-lg font-display">{stat.value}</div>
                <div className="text-max-muted text-[10px]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        {user.badges && user.badges.length > 0 && (
          <div className="max-card p-4">
            <h3 className="text-max-text font-semibold text-sm mb-3">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {user.badges.map(badge => {
                const meta = BADGE_META[badge] || { emoji: '🏅', label: badge };
                return (
                  <div key={badge} className="flex items-center gap-1.5 bg-max-surface px-3 py-1.5 rounded-full border border-max-border">
                    <span>{meta.emoji}</span>
                    <span className="text-max-text text-xs font-medium">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Account info */}
        <div className="max-card p-4 space-y-2">
          <h3 className="text-max-text font-semibold text-sm mb-3">Account</h3>
          <div className="flex justify-between text-sm">
            <span className="text-max-muted">Email</span>
            <span className="text-max-text">{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-max-muted">Username</span>
            <span className="text-max-text">@{user.username}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-max-muted">Member since</span>
            <span className="text-max-text">{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-max-card border border-max-border text-max-pink rounded-xl text-sm font-semibold hover:bg-max-pink hover:text-white transition-all duration-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
