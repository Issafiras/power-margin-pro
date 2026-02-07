
import axios from 'axios';

const url = "https://www.power.dk/api/v2/productlists?q=4188966,4150738&size=2";

async function inspect() {
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        // Print keys of the first product to identifying potential AI fields
        const products = res.data.products || [];
        if (products.length > 0) {
            console.log("Product Keys:", Object.keys(products[0]));
            // Check nested objects too
            console.log("Specs:", products[0].specs ? Object.keys(products[0].specs) : "No specs");
            console.log("Full Product 1:", JSON.stringify(products[0], null, 2));
        } else {
            console.log("No products found");
        }
    } catch (e: any) {
        console.error(e.message);
    }
}

inspect();
