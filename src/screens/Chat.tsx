import { useState, KeyboardEvent, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useRideChat } from '../hooks/useRideChat';
import { rideApi, Ride } from '../services/rides';

const formatTime = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
  }).format(new Date(timestamp));

export default function Chat() {
  const { navigateTo, activeRideId, userRole, userName } = useApp();
  const hasRideSelected = Boolean(activeRideId);
  const [ride, setRide] = useState<Ride | null>(null);
  const [rideError, setRideError] = useState<string | null>(null);
  const [rideLoading, setRideLoading] = useState(false);

  useEffect(() => {
    if (!activeRideId) {
      setRide(null);
      setRideError(null);
      setRideLoading(false);
      return;
    }
    let cancelled = false;
    setRideLoading(true);
    setRideError(null);
    rideApi
      .getById(activeRideId)
      .then((data) => {
        if (!cancelled) setRide(data);
      })
      .catch((err) => {
        if (!cancelled) setRideError(err instanceof Error ? err.message : 'Unable to load ride.');
      })
      .finally(() => {
        if (!cancelled) setRideLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeRideId]);

  const firstApprovedPassenger = ride?.requests?.find((req) => req.status === 'Approved');
  const counterpartName = ride
    ? userRole === 'driver'
      ? firstApprovedPassenger?.name ?? 'Passenger'
      : ride.driver.name
    : 'Select a ride';

  const senderName =
    userName ||
    (userRole === 'driver'
      ? ride?.driver.name ?? 'Driver'
      : firstApprovedPassenger?.name ?? 'Rider');

  const { messages, sendMessage, canSend, remainingSlots, maxMessages, maxMessageLength } = useRideChat(
    hasRideSelected && activeRideId ? activeRideId : null,
    userRole,
    senderName
  );

  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rideCompleted = ride?.status === 'Completed';
  const inputDisabled = !canSend || rideCompleted || !activeRideId;

  const handleSend = () => {
    if (inputDisabled) {
      setError(rideCompleted ? 'Ride is completed. Chat has been archived.' : 'Select a ride to start chatting.');
      return;
    }
    const result = sendMessage(message);
    if (!result.ok) {
      const errorMessages: Record<'missing-ride' | 'missing-role' | 'empty', string> = {
        'missing-ride': 'Select a ride to start chatting.',
        'missing-role': 'Set your role before sending messages.',
        empty: 'Type a message first.',
      };
      setError(errorMessages[result.reason]);
      return;
    }
    setMessage('');
    setError(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-1 flex-col items-center justify-center text-center text-gray-600 p-8">
      <p className="text-lg font-semibold mb-2">Select a ride to start chatting</p>
      <p className="text-sm">Head to My Rides, choose a trip, and then open chat.</p>
      <button
        className="mt-6 px-5 py-2 border border-black rounded-lg text-black font-semibold hover:bg-black hover:text-white transition-colors"
        onClick={() => navigateTo('my-rides')}
      >
        Go to My Rides
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => navigateTo('ride-details')}
          className="flex items-center text-black hover:opacity-70 transition-opacity font-semibold"
        >
          <ArrowLeft size={24} className="mr-2" />
          Back
        </button>
        <div className="mt-3">
          <p className="text-lg font-bold text-black">{counterpartName}</p>
          {ride && (
            <p className="text-xs text-gray-600">
              {ride.start.label} → {ride.destination.label}
            </p>
          )}
          {rideCompleted && <p className="text-xs text-red-500 font-semibold">Ride completed • Chat archived</p>}
        </div>
      </div>

      {!hasRideSelected ? (
        renderEmptyState()
      ) : rideLoading ? (
        <div className="flex flex-1 items-center justify-center text-gray-500 text-sm font-semibold">
          Loading ride context...
        </div>
      ) : rideError ? (
        <div className="flex flex-1 items-center justify-center text-red-500 text-sm font-semibold px-6 text-center">
          {rideError}
        </div>
      ) : (
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length === 0 && (
              <p className="text-center text-sm text-gray-500">No messages yet. Say hello to get started.</p>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderRole === userRole;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-sm ${isMe ? 'text-right' : 'text-left'}`}>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">
                      {isMe ? 'You' : msg.senderName}
                    </p>
                    <div
                      className={`inline-block px-5 py-3 rounded-2xl smooth-transition ${isMe
                        ? 'bg-black text-white rounded-br-none shadow-lg'
                        : 'bg-gray-100 text-black border-2 border-gray-300 rounded-bl-none'
                        }`}
                    >
                      <p className="text-sm font-medium leading-relaxed break-words">{msg.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 font-medium">{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 border-t-2 border-gray-200 bg-white sticky bottom-0">
        <div className="max-w-2xl mx-auto">
          {error && <p className="mb-2 text-sm font-medium text-red-500">{error}</p>}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={
                rideCompleted ? 'Ride completed. Chat is read-only.' : 'Type a message (max 100 characters)…'
              }
              value={message}
              maxLength={maxMessageLength}
              disabled={inputDisabled}
              onKeyDown={handleKeyDown}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg smooth-transition focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm font-medium disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={inputDisabled || !message.trim()}
              className="px-6 py-3 bg-black text-white rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              {Math.max(remainingSlots, 0)} of {maxMessages} messages retained
            </span>
            <span>{maxMessageLength - message.length} characters left</span>
          </div>
        </div>
      </div>
    </div>
  );
}
