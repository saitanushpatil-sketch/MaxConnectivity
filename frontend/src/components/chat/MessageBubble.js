import { useState, useRef } from 'react';
import { format } from 'date-fns';
import Avatar from '../ui/Avatar';
import { useSocket } from '../../hooks/useSocket';

const QUICK_REACTIONS = ['😂', '❤️', '🔥', '😭', '💀', '👀', '🤙', '💯'];

export default function MessageBubble({ message, isOwn, onReply, prevMessage, conversationId }) {
  const [showReactions, setShowReactions] = useState(false);
  const [longPress, setLongPress] = useState(false);
  const pressTimer = useRef(null);
  const { reactToMessage } = useSocket();

  const isMeme = message.type === 'meme' || message.type === 'image';
  const isDeleted = message.isDeleted;
  const showAvatar = !isOwn && (!prevMessage || prevMessage.sender?._id !== message.sender?._id);
  const showTime = !prevMessage || (new Date(message.createdAt) - new Date(prevMessage?.createdAt)) > 5 * 60 * 1000;

  const handleLongPressStart = () => {
    pressTimer.current = setTimeout(() => {
      setShowReactions(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    clearTimeout(pressTimer.current);
  };

  const handleReact = (emoji) => {
    reactToMessage(message._id, emoji, message.conversationId || conversationId);
    setShowReactions(false);
  };

  const groupedReactions = message.reactions?.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} message-appear`}>
      {/* Time separator */}
      {showTime && (
        <div className="flex items-center justify-center w-full my-3">
          <span className="text-[10px] text-max-muted bg-max-surface px-3 py-1 rounded-full">
            {format(new Date(message.createdAt), 'h:mm a')}
          </span>
        </div>
      )}

      {/* Sender name for incoming */}
      {!isOwn && showAvatar && (
        <div className="flex items-center gap-1.5 mb-1 ml-10">
          <span className="text-[11px] text-max-muted font-medium">{message.sender?.displayName}</span>
        </div>
      )}

      <div className={`flex items-end gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isOwn && (
          <div className="flex-shrink-0 mb-1">
            {showAvatar ? <Avatar user={message.sender} size="sm" /> : <div className="w-8" />}
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          {/* Reaction popup */}
          {showReactions && (
            <div
              className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 bg-max-card border border-max-border rounded-2xl px-2 py-1.5 flex gap-1 z-50 shadow-xl animate-bounce-in`}
              onMouseLeave={() => setShowReactions(false)}
            >
              {QUICK_REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="text-lg hover:scale-125 transition-transform active:scale-95 p-0.5"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div className={`mb-1 px-3 py-2 rounded-xl border-l-2 border-max-cyan bg-max-surface text-xs max-w-[220px] ${isOwn ? 'text-right border-l-0 border-r-2' : ''}`}>
              <p className="text-max-cyan font-medium text-[10px] mb-0.5">Reply</p>
              <p className="text-max-muted truncate">
                {message.replyTo.type === 'meme' ? `🖼️ ${message.replyTo.memeName}` : message.replyTo.content}
              </p>
            </div>
          )}

          {/* Main bubble */}
          <div
            className={`relative rounded-2xl overflow-hidden cursor-pointer select-none ${
              isOwn
                ? 'bg-max-cyan text-max-bg rounded-br-sm'
                : 'bg-max-card text-max-text border border-max-border rounded-bl-sm'
            } ${message.optimistic ? 'opacity-80' : ''}`}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onDoubleClick={() => handleReact('❤️')}
            onContextMenu={(e) => { e.preventDefault(); setShowReactions(true); }}
          >
            {isDeleted ? (
              <p className={`px-4 py-2.5 text-sm italic ${isOwn ? 'text-max-bg/60' : 'text-max-muted'}`}>
                🚫 Message deleted
              </p>
            ) : isMeme ? (
              <div>
                <img
                  src={message.memeUrl}
                  alt={message.memeName || 'meme'}
                  className="max-w-[220px] max-h-[200px] object-contain"
                  loading="lazy"
                />
                {message.memeName && (
                  <p className={`px-3 py-1.5 text-xs font-medium ${isOwn ? 'text-max-bg/80' : 'text-max-muted'}`}>
                    {message.memeName}
                  </p>
                )}
              </div>
            ) : (
              <p className="px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap">
                {message.content}
              </p>
            )}

            {/* Optimistic sending indicator */}
            {message.optimistic && isOwn && (
              <div className="absolute bottom-1 right-2">
                <div className="w-2 h-2 border border-max-bg/60 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Reactions display */}
          {groupedReactions && Object.keys(groupedReactions).length > 0 && (
            <div className={`flex gap-1 mt-1 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(groupedReactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="flex items-center gap-0.5 bg-max-card border border-max-border rounded-full px-2 py-0.5 text-xs hover:border-max-cyan transition-colors"
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-max-muted">{count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Reply button on hover */}
          {!isDeleted && (
            <button
              onClick={onReply}
              className={`absolute ${isOwn ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 group-hover:opacity-100 text-max-muted hover:text-max-cyan transition-all text-sm p-1`}
              title="Reply"
            >
              ↩
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
