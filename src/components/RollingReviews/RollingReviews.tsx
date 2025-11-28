import React from 'react';
import { Star } from 'lucide-react';
import '../../styles/rollingReviews.css';

interface Review {
    id: number;
    name: string;
    role: string;
    image: string;
    rating: number;
    text: string;
}

const reviews: Review[] = [
    {
        id: 1,
        name: 'Nirali Shah',
        role: 'Mobility Lead',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        rating: 5,
        text: 'RideMate lets us coordinate 30+ daily carpools without a dispatcher. The live dashboard is basically air traffic control for commutes.',
    },
    {
        id: 2,
        name: 'Diego Martínez',
        role: 'Driver Partner',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        rating: 5,
        text: 'As a driver, heatmap nudges and payout transparency mean I never guess where to go. My idle time dropped by half.',
    },
    {
        id: 3,
        name: 'Leah Williams',
        role: 'Ops Director',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        rating: 4,
        text: 'We run company offsites and RideMate handles every airport transfer. The concierge chat and multi-stop planner are game changers.',
    },
    {
        id: 4,
        name: 'Arjun Patel',
        role: 'Daily Commuter',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        rating: 5,
        text: 'The predictive pickups are scarily accurate. I save about 20 minutes every day just by avoiding traffic hotspots.',
    },
    {
        id: 5,
        name: 'Sarah Chen',
        role: 'Product Manager',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
        rating: 5,
        text: 'Cleanest UI I have ever seen in a ride app. It feels premium and works flawlessly. Highly recommended.',
    },
];

const RollingReviews: React.FC = () => {
    // Duplicate reviews to create infinite scroll effect
    const displayReviews = [...reviews, ...reviews, ...reviews];

    return (
        <div className="rolling-reviews-container">
            <div className="rolling-reviews-track">
                {displayReviews.map((review, index) => (
                    <div key={`${review.id}-${index}`} className="review-card">
                        <div className="review-header">
                            <img src={review.image} alt={review.name} className="review-avatar" />
                            <div className="review-info">
                                <h4>{review.name}</h4>
                                <p>{review.role}</p>
                            </div>
                        </div>
                        <div className="review-stars">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`star-icon ${i < review.rating ? 'fill-black' : 'fill-gray-200 text-gray-200'}`}
                                />
                            ))}
                        </div>
                        <p className="review-text">"{review.text}"</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RollingReviews;
