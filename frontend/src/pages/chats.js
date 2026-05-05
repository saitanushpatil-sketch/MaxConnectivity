import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import { friendsAPI, messagesAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import Avatar from '../components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';

export default function ChatsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [friends, setFriends] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeTab, setActiveTab] = useState('chats');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { on } = useSocket();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  // Real-time status updates
  useEffect(() => {
    const unsub = on('user_status', ({ userId, status }) => {
      if (status === 'online') setOnlineUsers(s => new Set([...s, userId]));
      else setOnlineUsers(s => { const n = new Set(s); n.delete(userId); return n; });
    });
    const unsubMsg = on('new_message_notification', () => loadData());
    return () => { unsub?.(); unsubMsg?.(); };
  }, [on]);

  const loadData = async () => {
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        friendsAPI.getFriends(),
        friendsAPI.getPending()
      ]);
      setFriends(friendsRes.data.friends || []);
      setPendingCount(pendingRes.data.incoming?.length || 0);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getConversationId = (friendId) => {
    return [user._id, friendId].sort().join('_');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !user) return (
    <div className="min-h-screen bg-max-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-max-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-max-bg flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-max-surface border-b border-max-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-max-cyan font-bold font-display text-lg neon-glow">MAX</span>
          <span className="text-xs bg-max-cyan text-max-bg px-2 py-0.5 rounded-full font-semibold">BETA</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/friends" className="relative p-2 hover:bg-max-card rounded-lg transition-colors">
            <span className="text-lg">👥</span>
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-max-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link href="/search" className="p-2 hover:bg-max-card rounded-lg transition-colors">
            <span className="text-lg">🔍</span>
          </Link>
          <Link href="/profile" className="p-2">
            <Avatar user={user} size="sm" />
          </Link>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-semibold text-max-text font-display">
          Hey {user.displayName?.split(' ')[0]} 👋
        </h2>
        <p className="text-max-muted text-sm">
          {friends.length === 0 ? 'Add friends to start chatting' : `${friends.length} friend${friends.length !== 1 ? 's' : ''} connected`}
        </p>
      </div>

      {/* Friends/Chats list */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {loading ? (
          <div className="space-y-3 mt-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 max-card rounded-2xl animate-pulse">
                <div className="w-12 h-12 rounded-full bg-max-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-max-border rounded w-1/2" />
                  <div className="h-2 bg-max-border rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-max-text font-semibold mb-2">No chats yet</h3>
            <p className="text-max-muted text-sm mb-4">Find friends to start a conversation</p>
            <Link href="/search" className="bg-max-cyan text-max-bg px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-colors">
              Find Friends
            </Link>
          </div>
        ) : (
          <div className="space-y-2 mt-3">
            {friends.map(friend => (
              <Link
                key={friend._id}
                href={`/chat/${getConversationId(friend._id)}?friendId=${friend._id}`}
                className="flex items-center gap-3 p-3 max-card rounded-2xl hover:border-max-cyan/30 transition-all duration-150 active:scale-[0.98]"
              >
                <div className="relative flex-shrink-0">
                  <Avatar user={friend} size="md" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-max-card ${
                    onlineUsers.has(friend._id) || friend.status === 'online' ? 'status-online' : 'status-offline'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-max-text text-sm">{friend.displayName}</span>
                    {friend.lastSeen && friend.status !== 'online' && (
                      <span className="text-[10px] text-max-muted">
                        {formatDistanceToNow(new Date(friend.lastSeen), { addSuffix: true })}
                      </span>
                    )}
                    {(onlineUsers.has(friend._id) || friend.status === 'online') && (
                      <span className="text-[10px] text-max-green font-medium">online</span>
                    )}
                  </div>
                  <p className="text-max-muted text-xs truncate mt-0.5">
                    @{friend.username} {friend.bio ? `• ${friend.bio}` : ''}
                  </p>
                </div>
                <span className="text-max-muted text-lg">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-max-surface border-t border-max-border px-6 py-2 flex justify-around items-center">
        <Link href="/chats" className="flex flex-col items-center gap-0.5 py-1 px-3">
          <span className="text-xl">💬</span>
          <span className="text-[10px] text-max-cyan font-medium">Chats</span>
        </Link>
        <Link href="/friends" className="flex flex-col items-center gap-0.5 py-1 px-3 relative">
          <span className="text-xl">👥</span>
          <span className="text-[10px] text-max-muted">Friends</span>
          {pendingCount > 0 && <span className="absolute -top-0.5 right-2 w-3.5 h-3.5 bg-max-pink text-white text-[9px] font-bold rounded-full flex items-center justify-center">{pendingCount}</span>}
        </Link>
        <Link href="/search" className="flex flex-col items-center gap-0.5 py-1 px-3">
          <span className="text-xl">🔍</span>
          <span className="text-[10px] text-max-muted">Search</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 py-1 px-3">
          <span className="text-xl">👤</span>
          <span className="text-[10px] text-max-muted">Profile</span>
        </Link>
      </div>
    </div>
  );
}
