import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import { usersAPI, friendsAPI } from '../utils/api';
import Avatar from '../components/ui/Avatar';

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await usersAPI.search(query.trim());
        setResults(data.users || []);
      } catch {
        toast.error('Search failed');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleFriendAction = async (user) => {
    setActionLoading(s => ({ ...s, [user._id]: true }));
    try {
      if (user.friendStatus === 'none') {
        await friendsAPI.sendRequest(user._id);
        toast.success(`Friend request sent to ${user.displayName}! 🎉`);
        setResults(prev => prev.map(u => u._id === user._id ? { ...u, friendStatus: 'pending', isRequestSender: true } : u));
      } else if (user.friendStatus === 'pending' && !user.isRequestSender) {
        await friendsAPI.respond(user.requestId, 'accept');
        toast.success('Friend accepted! 🎊');
        setResults(prev => prev.map(u => u._id === user._id ? { ...u, friendStatus: 'accepted' } : u));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(s => ({ ...s, [user._id]: false }));
    }
  };

  const getActionLabel = (user) => {
    if (user.friendStatus === 'accepted') return { label: '✓ Friends', disabled: true, className: 'bg-max-border text-max-muted' };
    if (user.friendStatus === 'pending' && user.isRequestSender) return { label: 'Pending', disabled: true, className: 'bg-max-border text-max-muted' };
    if (user.friendStatus === 'pending' && !user.isRequestSender) return { label: 'Accept', disabled: false, className: 'bg-max-green text-max-bg' };
    return { label: '+ Add', disabled: false, className: 'bg-max-cyan text-max-bg' };
  };

  return (
    <div className="min-h-screen bg-max-bg max-w-md mx-auto">
      {/* Header */}
      <div className="bg-max-surface border-b border-max-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-max-card rounded-lg">
          <span className="text-max-muted text-lg">←</span>
        </button>
        <div className="flex-1 bg-max-card border border-max-border rounded-xl flex items-center px-3 gap-2 focus-within:border-max-cyan transition-colors">
          <span className="text-max-muted">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by username or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-max-text text-sm placeholder-max-muted py-2.5 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-max-muted hover:text-max-text">×</button>
          )}
        </div>
      </div>

      <div className="p-4">
        {searching && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-max-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!searching && query.length >= 2 && results.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-max-muted text-sm">No users found for "{query}"</p>
          </div>
        )}

        {!query && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👀</div>
            <p className="text-max-text font-medium mb-1">Find your people</p>
            <p className="text-max-muted text-sm">Search by username, display name, or email</p>
          </div>
        )}

        <div className="space-y-2">
          {results.map(user => {
            const action = getActionLabel(user);
            return (
              <div key={user._id} className="max-card p-3 flex items-center gap-3 animate-slide-up">
                <Avatar user={user} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-max-text font-semibold text-sm">{user.displayName}</p>
                  <p className="text-max-muted text-xs">@{user.username}</p>
                  {user.bio && <p className="text-max-muted text-xs mt-0.5 truncate">{user.bio}</p>}
                </div>
                <button
                  onClick={() => !action.disabled && handleFriendAction(user)}
                  disabled={action.disabled || actionLoading[user._id]}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${action.className} ${action.disabled ? 'cursor-default opacity-70' : 'hover:opacity-90 active:scale-95'}`}
                >
                  {actionLoading[user._id] ? '...' : action.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
