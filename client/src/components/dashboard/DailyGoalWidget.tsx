import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp, Zap, Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/specExtractor";

interface DailyGoalWidgetProps {
    currentMargin: number;
}

export function DailyGoalWidget({ currentMargin }: DailyGoalWidgetProps) {
    const [progress, setProgress] = useState(0);
    const goal = 2500; // Simulated daily margin goal
    const percentage = Math.min(100, (currentMargin / goal) * 100);

    useEffect(() => {
        // Animate progress on mount
        const timer = setTimeout(() => setProgress(percentage), 500);
        return () => clearTimeout(timer);
    }, [percentage]);

    return (
        <Card className="glass border-white/5 relative overflow-hidden group">
            {/* Background Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="p-4 relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400">
                            <Trophy className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Dagens Mål</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-bold text-foreground">{formatPrice(currentMargin)}</span>
                                <span className="text-[10px] text-muted-foreground">/ {formatPrice(goal)}</span>
                            </div>
                        </div>
                    </div>

                    <Badge variant="outline" className={`text-[10px] h-5 ${percentage >= 100 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                        {Math.round(percentage)}%
                    </Badge>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                    <motion.div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Potentiel bonus</span>
                    <span className="text-green-400 flex items-center gap-1 font-medium">
                        <Coins className="h-3 w-3" />
                        +{formatPrice(currentMargin * 0.05)} {/* Simulated 5% commission */}
                    </span>
                </div>
            </div>
        </Card>
    );
}
