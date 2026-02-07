
import axios from "axios";

const ids = ["4188966", "4150738"];
const POWER_API_BASE = "https://www.power.dk/api/v2/products";

async function fetchProduct(id: string) {
    try {
        // Try different endpoints often used by e-commerce sites
        // 1. Direct product endpoint (failed previously for 4188966)
        // 2. Search endpoint
        const searchUrl = `https://www.power.dk/api/v2/productlists?q=${id}&size=1`;
        console.log(`Trying search: ${searchUrl}`);
        const searchRes = await axios.get(searchUrl);
        if (searchRes.data && searchRes.data.products && searchRes.data.products.length > 0) {
            console.log(`Found product ${id} via search`);
            return searchRes.data.products[0];
        }
    } catch (e: any) {
        console.error(`Error fetching ${id}: ${e.message}`);
    }
    return null;
}

async function main() {
    const p1 = await fetchProduct(ids[0]);
    const p2 = await fetchProduct(ids[1]);

    console.log("Product 1:", p1 ? p1.title : "Not Found");
    console.log("Product 2:", p2 ? p2.title : "Not Found");

    if (p1 && p2) {
        console.log("\nComparison Data Available!");
        // Log more details if found
        console.log(JSON.stringify({ p1, p2 }, null, 2));
    }
}

main();
