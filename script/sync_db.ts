
import "dotenv/config";
import axios from "axios";
import { storage } from "../server/storage";
import { InsertProduct } from "../shared/schema";

const POWER_API_BASE = "https://www.power.dk/api/v2/productlists";
const LAPTOP_CATEGORY_ID = 1341;
const PAGE_SIZE = 40;

// Internal Helpers (copied from routes.ts to avoid importing the whole app)
function getCpuTier(cpuString: string): number {
    const cpu = cpuString.toLowerCase();
    if (/apple\s+m[34]\s*(max|ultra)/i.test(cpu)) return 10;
    if (/core\s+ultra\s+9/i.test(cpu)) return 10;
    if (/i9[- ]?(1\d)\d{3}hx/i.test(cpu)) return 10;
    return 5; // Simplified fallback for script
}

function extractSpecs(productName: string, salesArguments?: string): any {
    const specs: any = {};
    const cleanName = productName.replace(/[™®]/g, '');
    const cleanSalesArgs = (salesArguments || "").replace(/[™®]/g, '');
    const searchText = cleanSalesArgs ? `${cleanSalesArgs}\n${cleanName}` : cleanName;

    // RAM
    const ramPatterns = [/(\d{1,3})\s*GB\s*(?:RAM|DDR[45]|LPDDR[45x])/i, /RAM\s*(\d{1,3})\s*GB/i];
    for (const pattern of ramPatterns) {
        const match = searchText.match(pattern);
        if (match) {
            specs.ram = `${match[1]} GB`;
            specs.ramGB = parseInt(match[1], 10);
            break;
        }
    }

    // Storage
    const storagePatterns = [/(\d+)\s*(?:GB|TB|G|T)\s*(?:M\.2\s*)?(?:SSD|NVMe|HDD|PCIe|Gen\d)/i, /Lager\s*(\d+)\s*(?:GB|TB|G|T)/i];
    for (const pattern of storagePatterns) {
        const match = searchText.match(pattern);
        if (match) {
            const val = parseInt(match[1], 10);
            if (/T/i.test(match[0])) { specs.storage = `${val} TB`; specs.storageGB = val * 1024; }
            else { specs.storage = `${val} GB`; specs.storageGB = val; }
            break;
        }
    }

    // CPU
    const cpuPatterns = [
        /Apple\s+M[1234]\s*(?:Pro|Max|Ultra)?/i,
        /Snapdragon\s+X\s*(?:Elite|Plus)?/i,
        /Intel\s+Core\s+Ultra\s+[3579]\s*(?:\d{3}[A-Z]*)?/i,
        /Intel\s+Core\s+[3579]\s+\d{3}[A-Z]*/i,
        /Intel\s+Core\s+i[3579][\s-]?(?:\d{4,5}[A-Z]*)?/i,
        /AMD\s+Ryzen\s+AI\s*\d+\s*(?:\d{3,4}[A-Z]*)?/i,
        /AMD\s+Ryzen\s+[3579]\s*\d{4}[A-Z]*/i,
    ];
    for (const pattern of cpuPatterns) {
        const match = searchText.match(pattern);
        if (match) {
            specs.cpu = match[0].trim();
            break;
        }
    }

    // GPU
    const gpuPatterns = [
        /RTX\s*50\d{2}/i, /RTX\s*40\d{2}/i, /RTX\s*30\d{2}/i,
        /GeForce\s+(?:RTX|GTX)\s*\d{4}/i,
        /Radeon\s+RX\s*\d{4}/i,
        /Intel\s+Arc\s+[\dA-Z]+/i
    ];
    for (const pattern of gpuPatterns) {
        const match = searchText.match(pattern);
        if (match) {
            specs.gpu = match[0].trim();
            break;
        }
    }

    return specs;
}

async function syncProducts() {
    console.log("Starting product sync (Standalone Mode)...");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is missing!");
        process.exit(1);
    } else {
        console.log("✅ DATABASE_URL found.");
    }

    let page = 0;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore) {
        try {
            const from = page * PAGE_SIZE;
            const url = `${POWER_API_BASE}?cat=${LAPTOP_CATEGORY_ID}&size=${PAGE_SIZE}&from=${from}`;
            console.log(`Fetching page ${page + 1}... (${url})`);

            const response = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }, timeout: 10000 });
            const products = response.data?.products || [];

            if (products.length === 0) {
                hasMore = false;
                break;
            }

            const productsToInsert: InsertProduct[] = [];

            for (const p of products) {
                const title = p.title || "Ukendt";
                const brand = p.manufacturerName || "Ukendt";
                const price = p.price || 0;
                const salesArgs = p.salesArguments || "";
                const specs = extractSpecs(title, salesArgs);

                let isHighMargin = false;
                let marginReason = undefined;
                // Simple margin logic
                if (brand.toLowerCase() === "cepter") { isHighMargin = true; marginReason = "Cepter brand"; }
                else if (price.toString().endsWith("98") || price.toString().endsWith("92")) { isHighMargin = true; marginReason = "Pris-ending"; }

                const imageUrl = p.productImage?.basePath
                    ? (p.productImage.basePath.startsWith("http") ? p.productImage.basePath : `https://media.power-cdn.net${p.productImage.basePath}`) + (p.productImage.variants?.[0]?.filename ? `/${p.productImage.variants[0].filename}` : '')
                    : null;

                productsToInsert.push({
                    id: p.productId?.toString(),
                    name: title,
                    brand: brand,
                    price: price,
                    originalPrice: p.previousPrice || null,
                    imageUrl: imageUrl,
                    productUrl: p.url ? (p.url.startsWith("http") ? p.url : `https://www.power.dk${p.url}`) : "",
                    sku: p.barcode || p.elguideId,
                    inStock: p.stockCount > 0 || p.canAddToCart,
                    isHighMargin: isHighMargin,
                    marginReason: marginReason || null,
                    specs: specs,
                });
            }

            if (productsToInsert.length > 0) {
                await storage.upsertProducts(productsToInsert);
                totalSynced += productsToInsert.length;
                console.log(`Synced ${productsToInsert.length} products. Total: ${totalSynced}`);
            }

            if (products.length < PAGE_SIZE) hasMore = false;
            page++;
            await new Promise(r => setTimeout(r, 500));

        } catch (error: any) {
            console.error(`Error on page ${page + 1}:`, error.message);
            hasMore = false;
        }
    }
    console.log(`Sync complete! Total: ${totalSynced}`);
}

syncProducts().catch(console.error);
