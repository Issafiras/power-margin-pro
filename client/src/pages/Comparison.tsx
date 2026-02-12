
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { ProductWithMargin } from "@shared/schema";

export default function Comparison() {
    const [location, setLocation] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);

    // Support both comma-separated 'ids' and multiple 'id' params (Power.dk style)
    let ids: string[] = [];
    if (searchParams.has("ids")) {
        ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    } else {
        ids = searchParams.getAll("id").filter(Boolean);
    }

    // Join IDs for the API call
    const idsParam = ids.join(",");

    const { data, isLoading, error } = useQuery<{ products: ProductWithMargin[] }>({
        queryKey: ["compare", idsParam],
        queryFn: async () => {
            if (!idsParam) return { products: [] };
            const res = await fetch(`/api/compare?ids=${idsParam}`);
            if (!res.ok) throw new Error("Failed to fetch comparison data");
            return res.json();
        },
        enabled: ids.length > 0,
    });

    if (!idsParam || ids.length === 0) {
        return (
            <div className="min-h-screen p-8 flex flex-col items-center justify-center text-center">
                <h1 className="text-2xl font-bold mb-4 gradient-text">Ingen produkter valgt til sammenligning</h1>
                <Button onClick={() => setLocation("/")}>Gå tilbage til Dashboard</Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen p-8 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-xl font-bold mb-4 text-destructive">Fejl ved indlæsning af sammenligning</h1>
                <Button onClick={() => setLocation("/")}>Gå tilbage</Button>
            </div>
        );
    }

    const products = data.products;

    // Comparison Rows Config
    const rows = [
        { label: "Pris", render: (p: ProductWithMargin) => <span className="font-bold text-lg">{(p.price || 0).toLocaleString("da-DK")} kr</span> },
        { label: "Mærke", render: (p: ProductWithMargin) => p.brand },
        { label: "CPU", render: (p: ProductWithMargin) => p.specs?.cpu || "-" },
        { label: "RAM", render: (p: ProductWithMargin) => p.specs?.ram || "-" },
        { label: "Lagerplads", render: (p: ProductWithMargin) => p.specs?.storage || "-" },
        { label: "Skærm", render: (p: ProductWithMargin) => `${p.specs?.screenSize || ""} ${p.specs?.screenType || ""} ${p.specs?.screenResolution || ""}` },
        { label: "Grafikkort", render: (p: ProductWithMargin) => p.specs?.gpu || "-" },
        { label: "Anbefalet", render: (p: ProductWithMargin) => p.isHighMargin ? <Check className="text-green-500 inline h-5 w-5" /> : <X className="text-muted-foreground inline h-5 w-5" /> },
        { label: "Begrundelse", render: (p: ProductWithMargin) => p.marginReason || "-" },
    ];

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-8 bg-background/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Tilbage
                </Button>
                <h1 className="text-3xl font-bold gradient-text">Produktsammenligning</h1>
                <div className="w-[100px]"></div> {/* Spacer for alignment */}
            </div>

            <div className="overflow-x-auto rounded-lg border border-border/50 bg-card/30 glass-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px] bg-muted/50">Specifikation</TableHead>
                            {products.map(product => (
                                <TableHead key={product.id} className="min-w-[250px] text-center bg-muted/30">
                                    <div className="flex flex-col items-center gap-4 py-4">
                                        {product.imageUrl ? (
                                            <div className="w-32 h-32 relative bg-white rounded-lg p-2 flex items-center justify-center">
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="max-w-full max-h-full object-contain mix-blend-multiply"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                                No Image
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <div className="font-bold text-lg leading-tight line-clamp-2 h-[3rem] px-2" title={product.name}>
                                                {product.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{product.sku || "Ingen SKU"}</div>
                                        </div>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow key={index} className={index % 2 === 0 ? "bg-muted/10" : "bg-transparent"}>
                                <TableCell className="font-medium bg-muted/30">{row.label}</TableCell>
                                {products.map(product => (
                                    <TableCell key={product.id} className="text-center">
                                        {row.render(product)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                        {/* Features Row */}
                        <TableRow>
                            <TableCell className="font-medium bg-muted/30 align-top pt-4">Funktioner</TableCell>
                            {products.map(product => (
                                <TableCell key={product.id} className="align-top">
                                    <ul className="text-sm space-y-1 text-muted-foreground">
                                        {product.specs?.features?.map((f, i) => <li key={i}>• {f}</li>) || "-"}
                                    </ul>
                                </TableCell>
                            ))}
                        </TableRow>
                        {/* Link Row */}
                        <TableRow>
                            <TableCell className="font-medium bg-muted/30">Link</TableCell>
                            {products.map(product => (
                                <TableCell key={product.id} className="text-center">
                                    <a
                                        href={product.productUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-sm"
                                    >
                                        Se på Power.dk
                                    </a>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
