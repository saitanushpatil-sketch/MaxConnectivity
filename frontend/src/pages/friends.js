import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import { friendsAPI } from '../utils/api';
import Avatar from '../components/ui/Avatar';

export default function FriendsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isAuthenticated) loadAll();
  }, [isAuthenticated]);

  const loadAll = async () => {
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        friendsAPI.getFriends(),
        friendsAPI.getPending()
      ]);
      setFriends(friendsRes.data.friends || []);
      setIncoming(pendingRes.data.incoming || []);
      setOutgoing(pendingRes.data.outgoing || []);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, action) => {
    try {
      await friendsAPI.respond(requestId, action);
      toast.success(action === 'accept' ? '✅ Friend accepted!' : '❌ Request declined');
      loadAll();
    } catch {
      toast.error('Failed to respond');
    }
  };

  const handleRemove = async (friendId) => {
    if (!confirm('Remove this friend?')) return;
    try {
      await friendsAPI.remove(friendId);
      toast.success('Friend removed');
      loadAll();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const getConversationId = (friendId) => [user._id, friendId].sort().join('_');

  const tabs = [
    { id: 'requests', label: 'Requests', count: incoming.length },
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'sent', label: 'Sent', count: outgoing.length },
  ];

  return (
    <div className="min-h-screen bg-max-bg max-w-md mx-auto">
      {/* Header */}
      <div className="bg-max-surface border-b border-max-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-max-card rounded-lg">
          <span className="text-max-muted text-lg">←</span>
        </button>
        <h1 className="text-max-text font-semibold font-display">Friends</h1>
        <div className="ml-auto">
          <Link href="/search" className="bg-max-cyan text-max-bg px-3 py-1.5 rounded-lg text-sm font-semibold">
            + Add
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-max-surface border-b border-max-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id ? 'text-max-cyan' : 'text-max-muted'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-max-cyan text-max-bg' : 'bg-max-border text-max-muted'}`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-max-cyan" />}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-max-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'requests' && (
              incoming.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-max-muted text-sm">No pending requests</p>
                </div>
              ) : incoming.map(req => (
                <div key={req._id} className="max-card p-3 flex items-center gap-3">
                  <Avatar user={req.sender} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-max-text font-medium text-sm">{req.sender.displayName}</p>
                    <p className="text-max-muted text-xs">@{req.sender.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(req._id, 'reject')}
                      className="px-3 py-1.5 bg-max-border text-max-muted rounded-lg text-xs hover:bg-opacity-80 transition-colors"
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => handleRespond(req._id, 'accept')}
                      className="px-3 py-1.5 bg-max-cyan text-max-bg rounded-lg text-xs font-semibold hover:bg-opacity-90 transition-colors"
                    >
                      ✓ Accept
                    </button>
                  </div>
                </div>
              ))
            )}

            {activeTab === 'friends' && (
              friends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🫂</div>
                  <p className="text-max-muted text-sm">No friends yet</p>
                  <Link href="/search" className="text-max-cyan text-sm mt-2 inline-block">Find people →</Link>
                </div>
              ) : friends.map(friend => (
                <div key={friend._id} className="max-card p-3 flex items-center gap-3">
                  <div className="relative">
                    <Avatar user={friend} size="md" />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-max-card ${friend.status === 'online' ? 'status-online' : 'status-offline'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-max-text font-medium text-sm">{friend.displayName}</p>
                    <p className="text-max-muted text-xs">@{friend.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/chat/${getConversationId(friend._id)}?friendId=${friend._id}`}
                      className="px-3 py-1.5 bg-max-cyan text-max-bg rounded-lg text-xs font-semibold"
                    >
                      Chat
                    </Link>
                    <button
                      onClick={() => handleRemove(friend._id)}
                      className="px-2 py-1.5 text-max-muted hover:text-max-pink rounded-lg text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}

            {activeTab === 'sent' && (
              outgoing.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📤</div>
                  <p className="text-max-muted text-sm">No outgoing requests</p>
                </div>
              ) : outgoing.map(req => (
                <div key={req._id} className="max-card p-3 flex items-center gap-3">
                  <Avatar user={req.receiver} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-max-text font-medium text-sm">{req.receiver.displayName}</p>
                    <p className="text-max-muted text-xs">@{req.receiver.username}</p>
                  </div>
                  <span className="text-xs text-max-muted bg-max-border px-2 py-1 rounded-full">Pending</span>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
