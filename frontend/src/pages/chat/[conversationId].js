import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuthStore from '../../context/authStore';
import { messagesAPI, usersAPI } from '../../utils/api';
import { useSocket } from '../../hooks/useSocket';
import Avatar from '../../components/ui/Avatar';
import MessageBubble from '../../components/chat/MessageBubble';
import MemePanel from '../../components/meme/MemePanel';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const router = useRouter();
  const { conversationId } = router.query;
  const friendId = router.query.friendId;

  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMemes, setShowMemes] = useState(false);
  const [typing, setTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { joinConversation, leaveConversation, sendMessage: socketSend, startTyping, stopTyping, markRead, on } = useSocket();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!conversationId || !friendId || !user) return;
    loadFriend();
    loadMessages();
    joinConversation(conversationId);
    return () => leaveConversation(conversationId);
  }, [conversationId, friendId, user]);

  // Socket listeners
  useEffect(() => {
    const unsub1 = on('receive_message', (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg]);
        markRead(conversationId);
      }
    });

    const unsub2 = on('user_typing', ({ userId: tUserId }) => {
      if (tUserId === friendId) setTyping(true);
    });

    const unsub3 = on('user_stop_typing', ({ userId: tUserId }) => {
      if (tUserId === friendId) setTyping(false);
    });

    const unsub4 = on('user_status', ({ userId: sUserId, status }) => {
      if (sUserId === friendId) setIsOnline(status === 'online');
    });

    const unsub5 = on('message_reacted', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    });

    return () => { unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); unsub5?.(); };
  }, [conversationId, friendId, on]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadFriend = async () => {
    try {
      const { data } = await usersAPI.getProfile(friendId);
      setFriend(data.user);
      setIsOnline(data.user.status === 'online');
    } catch {}
  };

  const loadMessages = async () => {
    try {
      setLoadingMsgs(true);
      const { data } = await messagesAPI.get(conversationId);
      setMessages(data.messages || []);
      markRead(conversationId);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMsgs(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    // Typing indicator
    startTyping(conversationId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(conversationId), 1500);
  };

  const sendTextMessage = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setShowMemes(false);
    stopTyping(conversationId);

    const optimisticMsg = {
      _id: `opt_${Date.now()}`,
      conversationId,
      sender: user,
      receiver: friendId,
      type: 'text',
      content,
      replyTo,
      reactions: [],
      createdAt: new Date().toISOString(),
      optimistic: true
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setReplyTo(null);
    setSending(true);

    socketSend({
      conversationId,
      receiverId: friendId,
      type: 'text',
      content,
      replyTo: replyTo?._id || null
    }, (res) => {
      if (res?.success) {
        setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? res.message : m));
      }
      setSending(false);
    });
  };

  const sendMeme = (meme) => {
    setShowMemes(false);
    const optimisticMsg = {
      _id: `opt_${Date.now()}`,
      conversationId,
      sender: user,
      receiver: friendId,
      type: 'meme',
      content: meme.name,
      memeUrl: meme.url,
      memeId: meme.id,
      memeName: meme.name,
      reactions: [],
      createdAt: new Date().toISOString(),
      optimistic: true
    };
    setMessages(prev => [...prev, optimisticMsg]);

    socketSend({
      conversationId,
      receiverId: friendId,
      type: 'meme',
      content: meme.name,
      memeUrl: meme.url,
      memeId: meme.id,
      memeName: meme.name,
    }, (res) => {
      if (res?.success) {
        setMessages(prev => prev.map(m => m._id === optimisticMsg._id ? res.message : m));
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  const toggleMemes = () => {
    setShowMemes(s => !s);
    if (!showMemes) inputRef.current?.focus();
  };

  if (isLoading || !user) return (
    <div className="min-h-screen bg-max-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-max-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen max-h-screen bg-max-bg max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-max-surface border-b border-max-border px-3 py-2.5 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-max-card rounded-lg transition-colors">
          <span className="text-max-muted text-lg">←</span>
        </button>

        {friend ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar user={friend} size="sm" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-max-surface ${isOnline ? 'status-online' : 'status-offline'}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-max-text font-semibold text-sm truncate">{friend.displayName}</h2>
              <p className="text-[11px] text-max-muted">
                {typing ? (
                  <span className="text-max-cyan flex items-center gap-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="ml-1">typing</span>
                  </span>
                ) : isOnline ? 'online' : friend.lastSeen ? `last seen ${formatDistanceToNow(new Date(friend.lastSeen), { addSuffix: true })}` : '@' + friend.username}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 h-8 bg-max-card rounded-lg animate-pulse" />
        )}

        <button className="p-1.5 hover:bg-max-card rounded-lg transition-colors">
          <span className="text-max-muted text-lg">⋮</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1" id="messages-container">
        {loadingMsgs ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-max-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-max-muted text-sm">Start the conversation!</p>
            <p className="text-max-muted text-xs mt-1">Send a message or drop a meme 🔥</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.sender?._id === user._id || msg.sender === user._id}
              onReply={() => setReplyTo(msg)}
              onReact={(emoji) => {/* handled in socket */}}
              prevMessage={messages[i - 1]}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-max-card border-t border-max-border">
          <div className="w-0.5 h-8 bg-max-cyan rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-max-cyan font-medium">Replying to {replyTo.sender?.displayName}</p>
            <p className="text-xs text-max-muted truncate">{replyTo.type === 'meme' ? `🖼️ ${replyTo.memeName}` : replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-max-muted hover:text-max-text text-lg p-1">×</button>
        </div>
      )}

      {/* Meme Panel */}
      {showMemes && (
        <MemePanel
          searchQuery={input}
          onSelectMeme={sendMeme}
          onClose={() => setShowMemes(false)}
        />
      )}

      {/* Input Bar */}
      <div className="flex-shrink-0 bg-max-surface border-t border-max-border px-3 py-2.5 flex items-end gap-2">
        <button
          onClick={toggleMemes}
          className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 ${showMemes ? 'bg-max-cyan text-max-bg' : 'bg-max-card text-max-muted hover:text-max-text'}`}
        >
          <span className="text-lg">🎭</span>
        </button>

        <div className="flex-1 bg-max-card border border-max-border rounded-xl px-3 py-2 flex items-center min-h-[42px]">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-max-text text-sm placeholder-max-muted resize-none outline-none max-h-24"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
          />
        </div>

        <button
          onClick={sendTextMessage}
          disabled={!input.trim() || sending}
          className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 ${
            input.trim() ? 'bg-max-cyan text-max-bg hover:bg-opacity-90 active:scale-95' : 'bg-max-card text-max-muted'
          }`}
        >
          <span className="text-lg">{sending ? '⏳' : '⚡'}</span>
        </button>
      </div>
    </div>
  );
}
