import React from 'react';
import { Leaf, Award, TreeDeciduous } from 'lucide-react';

interface GreenStatsCardProps {
    co2Saved: number;
    greenPoints: number;
}

const GreenStatsCard: React.FC<GreenStatsCardProps> = ({ co2Saved, greenPoints }) => {
    // Determine level based on points
    const getLevel = (points: number) => {
        if (points < 100) return { name: 'Seedling', icon: Leaf, color: 'text-green-400', minPoints: 0, nextLevel: 100 };
        if (points < 500) return { name: 'Sapling', icon: TreeDeciduous, color: 'text-green-500', minPoints: 100, nextLevel: 500 };
        return { name: 'Forest Guardian', icon: Award, color: 'text-emerald-600', minPoints: 500, nextLevel: 1000 };
    };

    const level = getLevel(greenPoints);
    const LevelIcon = level.icon;

    // Calculate progress to next level
    const progress = Math.min(100, Math.max(0, ((greenPoints - level.minPoints) / (level.nextLevel - level.minPoints)) * 100));

    return (
        <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl p-8 shadow-lg border-2 border-green-200/50 mb-6 relative overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Background decorations */}
            <div className="absolute -right-12 -top-12 opacity-[0.07]">
                <TreeDeciduous size={200} className="text-green-900" />
            </div>
            <div className="absolute -left-8 -bottom-8 opacity-[0.05]">
                <Leaf size={160} className="text-emerald-900" />
            </div>

            <div className="flex items-start justify-between relative z-10 mb-6">
                <div>
                    <h3 className="text-green-900 font-bold text-xl flex items-center gap-2.5">
                        <div className="p-2 bg-green-600 rounded-lg">
                            <Leaf className="w-5 h-5 text-white" />
                        </div>
                        GreenMiles Impact
                    </h3>
                    <p className="text-green-700 text-sm mt-2 font-medium">Your contribution to a greener planet</p>
                </div>
                <div className={`bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold ${level.color} border-2 border-green-300 shadow-md flex items-center gap-2`}>
                    <LevelIcon className="w-4 h-4" />
                    {level.name}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mt-7 relative z-10">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-green-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-2">CO2 Saved</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">
                        {co2Saved.toFixed(1)}
                        <span className="text-base font-semibold text-green-600 ml-1">kg</span>
                    </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border-2 border-green-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-2">Green Points</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">{greenPoints}</p>
                </div>
            </div>

            <div className="mt-7 relative z-10">
                <div className="flex justify-between text-sm text-green-800 mb-2 font-semibold">
                    <span>Level Progress</span>
                    <span>{greenPoints} / {level.nextLevel} pts</span>
                </div>
                <div className="h-3 bg-green-200/70 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-sm text-green-700 mt-3 text-center font-medium">
                    Ride more to grow your forest! 🌱
                </p>
            </div>
        </div>
    );
};

export default GreenStatsCard;
