export type ChatMessage = {
  id: string;
  text: string;
  timestamp: number;
  senderRole: 'driver' | 'rider';
  senderName: string;
};

export const CHAT_STORAGE_PREFIX = 'ridermate.chat.';
export const MAX_CHAT_MESSAGES = 20;
export const MAX_MESSAGE_LENGTH = 100;

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

export const buildChatStorageKey = (rideId: string) => `${CHAT_STORAGE_PREFIX}${rideId}`;

export const trimMessages = (messages: ChatMessage[]) =>
  messages.length > MAX_CHAT_MESSAGES ? messages.slice(messages.length - MAX_CHAT_MESSAGES) : messages;

export const loadChatMessages = (rideId: string | null): ChatMessage[] => {
  const storage = getStorage();
  if (!storage || rideId === null) return [];
  try {
    const raw = storage.getItem(buildChatStorageKey(rideId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const persistChatMessages = (rideId: string, messages: ChatMessage[]) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(buildChatStorageKey(rideId), JSON.stringify(trimMessages(messages)));
};

export const clearRideChat = (rideId: string | null) => {
  const storage = getStorage();
  if (!storage || rideId === null) return;
  storage.removeItem(buildChatStorageKey(rideId));
};

