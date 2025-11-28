import { useState } from 'react';
import { Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';

export default function Rating() {
  const { navigateTo } = useApp();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo('dashboard');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
        <div className="w-96 h-96 bg-gray-100 rounded-full"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white border-4 border-black rounded-2xl p-10 glow-shadow animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-black mb-2">How was your ride?</h1>
            <p className="text-gray-600 font-medium">Help us improve our service</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-gray-50 p-8 rounded-xl border-2 border-gray-300">
              <p className="text-center text-sm font-semibold text-gray-600 mb-6 uppercase">Rate your experience</p>
              <div className="flex justify-center gap-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-all duration-200 hover:scale-125"
                  >
                    <Star
                      size={48}
                      className={`${star <= (hoveredRating || rating)
                          ? 'text-black fill-black'
                          : 'text-gray-300'
                        } transition-colors duration-200`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center mt-4 text-lg font-bold text-black">
                  {rating === 5 && 'Excellent! 🎉'}
                  {rating === 4 && 'Great! 👍'}
                  {rating === 3 && 'Good 👌'}
                  {rating === 2 && 'Could be better'}
                  {rating === 1 && 'Need to improve'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-black">
                Additional Comments (Optional)
              </label>
              <textarea
                placeholder="Share your feedback with us..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg smooth-transition focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" fullWidth size="lg" disabled={!rating}>
                Submit Rating
              </Button>
              <Button type="button" variant="secondary" fullWidth size="lg" onClick={() => navigateTo('dashboard')}>
                Skip
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
