import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../context/authStore';

let socketInstance = null;

export const useSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    if (!socketInstance) {
      socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    socketRef.current = socketInstance;

    return () => {
      // Don't disconnect on component unmount, keep connection alive
    };
  }, [isAuthenticated, token]);

  const joinConversation = useCallback((conversationId) => {
    socketInstance?.emit('join_conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    socketInstance?.emit('leave_conversation', conversationId);
  }, []);

  const sendMessage = useCallback((data, callback) => {
    socketInstance?.emit('send_message', data, callback);
  }, []);

  const startTyping = useCallback((conversationId) => {
    socketInstance?.emit('typing_start', { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId) => {
    socketInstance?.emit('typing_stop', { conversationId });
  }, []);

  const reactToMessage = useCallback((messageId, emoji, conversationId) => {
    socketInstance?.emit('react_message', { messageId, emoji, conversationId });
  }, []);

  const markRead = useCallback((conversationId) => {
    socketInstance?.emit('mark_read', { conversationId });
  }, []);

  const on = useCallback((event, handler) => {
    socketInstance?.on(event, handler);
    return () => socketInstance?.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketInstance?.off(event, handler);
  }, []);

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    reactToMessage,
    markRead,
    on,
    off,
  };
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
