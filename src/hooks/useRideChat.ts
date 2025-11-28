import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChatMessage,
  MAX_CHAT_MESSAGES,
  MAX_MESSAGE_LENGTH,
  clearRideChat,
  loadChatMessages,
  persistChatMessages,
  trimMessages,
  buildChatStorageKey,
} from '../utils/chatStorage';

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const useRideChat = (
  rideId: string | null,
  senderRole: 'driver' | 'rider' | null,
  senderName: string
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!rideId) {
      setMessages([]);
      setIsReady(false);
      return;
    }
    setMessages(loadChatMessages(rideId));
    setIsReady(true);
  }, [rideId]);

  useEffect(() => {
    if (!rideId || typeof window === 'undefined') return;
    const handler = (event: StorageEvent) => {
      if (event.key === buildChatStorageKey(rideId)) {
        setMessages(loadChatMessages(rideId));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [rideId]);

  const persist = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      if (!rideId) return;
      setMessages((prev) => {
        const next = trimMessages(updater(prev));
        persistChatMessages(rideId, next);
        return next;
      });
    },
    [rideId]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!rideId) return { ok: false, reason: 'missing-ride' as const };
      if (!senderRole) return { ok: false, reason: 'missing-role' as const };
      const cleaned = text.trim();
      if (!cleaned) return { ok: false, reason: 'empty' as const };
      const safeText = cleaned.slice(0, MAX_MESSAGE_LENGTH);
      const message: ChatMessage = {
        id: createMessageId(),
        text: safeText,
        timestamp: Date.now(),
        senderRole,
        senderName: senderName || (senderRole === 'driver' ? 'Driver' : 'Rider'),
      };
      persist((prev) => [...prev, message]);
      return { ok: true as const };
    },
    [persist, rideId, senderRole, senderName]
  );

  const clearChatForRide = useCallback(() => {
    if (!rideId) return;
    clearRideChat(rideId);
    setMessages([]);
  }, [rideId]);

  const canSend = Boolean(rideId && senderRole);
  const remainingSlots = useMemo(() => MAX_CHAT_MESSAGES - messages.length, [messages.length]);

  return {
    messages,
    isReady,
    sendMessage,
    clearChat: clearChatForRide,
    canSend,
    remainingSlots,
    maxMessages: MAX_CHAT_MESSAGES,
    maxMessageLength: MAX_MESSAGE_LENGTH,
  };
};

