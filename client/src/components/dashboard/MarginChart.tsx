import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import type { ProductWithMargin } from "@shared/schema";
import { formatPrice } from '@/lib/specExtractor';
import { TrendingUp, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MarginChartProps {
    mainProduct: ProductWithMargin;
    alternatives: ProductWithMargin[];
}

export function MarginChart({ mainProduct, alternatives }: MarginChartProps) {
    const { theme } = useTheme();

    const data = useMemo(() => {
        const allProducts = [mainProduct, ...alternatives];
        return allProducts.map(p => ({
            name: p.name,
            price: p.price,
            score: p.upgradeScore || 50,
            isMain: p.id === mainProduct.id,
            isHighlight: p.isHighMargin,
            isTopPick: p.isTopPick,
            brand: p.brand,
            margin: p.isHighMargin ? 'Populær' : 'Standard'
        }));
    }, [mainProduct, alternatives]);

    // Calculate domain margins for better visual scaling
    const minPrice = Math.min(...data.map(d => d.price)) * 0.9;
    const maxPrice = Math.max(...data.map(d => d.price)) * 1.1;
    const minScore = Math.min(...data.map(d => d.score)) * 0.8;
    const maxScore = Math.max(...data.map(d => d.score)) * 1.1;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="glass-strong p-3 border border-white/10 rounded-xl shadow-xl text-xs">
                    <p className="font-bold mb-1 text-foreground">{data.name.substring(0, 30)}...</p>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Pris:</span>
                            <span className="font-mono font-medium text-primary">{formatPrice(data.price)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Score:</span>
                            <span className="font-mono font-medium text-green-400">{Math.round(data.score)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Type:</span>
                            <span className={`font-medium ${data.isHighlight ? 'text-orange-400' : 'text-slate-400'}`}>
                                {data.margin}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="glass border-white/5 overflow-hidden animate-fade-in delay-300">
            <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Værdi Analyse (Pris vs. Ydelse)
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] gap-1 bg-white/5">
                        <Info className="h-3 w-3" />
                        Find "Sweet Spot"
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0 h-[250px] relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none" />
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                        <XAxis
                            type="number"
                            dataKey="price"
                            name="Pris"
                            unit=" kr"
                            domain={[minPrice, maxPrice]}
                            tickFormatter={(val) => `${val / 1000}k`}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            type="number"
                            dataKey="score"
                            name="Score"
                            domain={[minScore, maxScore]}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tick={false} // Hide Y labels for cleaner look
                            label={{ value: 'Ydelse ↗', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        />
                        <ZAxis type="number" range={[60, 400]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <ReferenceLine x={mainProduct.price} stroke="hsl(var(--muted-foreground)/0.2)" strokeDasharray="3 3" />
                        <Scatter name="Products" data={data}>
                            {data.map((entry, index) => {
                                let fill = 'hsl(var(--muted))';
                                let stroke = 'transparent';

                                if (entry.isMain) {
                                    fill = 'hsl(var(--foreground))'; // White for customer choice
                                } else if (entry.isTopPick) {
                                    fill = 'hsl(var(--primary))'; // Orange for top pick
                                    stroke = 'hsl(var(--primary)/0.5)';
                                } else if (entry.isHighlight) {
                                    fill = 'hsl(var(--chart-2))'; // Purple/Chart2 for high margin
                                }

                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={fill}
                                        stroke={stroke}
                                        strokeWidth={entry.isTopPick ? 4 : 0}
                                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                    />
                                );
                            })}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="absolute bottom-2 right-4 flex gap-3 text-[9px] text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded-full border border-white/5">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-foreground" />
                        <span>Valg</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>Anbefalet</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[hsl(var(--chart-2))]" />
                        <span>Populær</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
