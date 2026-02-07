

import axios from 'axios';


const ids = ["4188966", "4150738"];
const endpoints = [
    `https://www.power.dk/api/v2/comparison/products?ids=${ids.join(',')}`,
    `https://www.power.dk/api/v2/comparison/summary?ids=${ids.join(',')}`,
    `https://www.power.dk/api/v2/ai/comparison?ids=${ids.join(',')}`,
    `https://www.power.dk/umbraco/api/comparison/get?ids=${ids.join(',')}`,
    `https://www.power.dk/api/v2/products/compare-details?ids=${ids.join(',')}`,
    `https://www.power.dk/api/v2/productlists/compare?ids=${ids.join(',')}`
];


async function probe() {
    console.log("Starting probe...");
    for (const url of endpoints) {
        try {
            console.log(`\nProbing: ${url}`);
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*'
                }
            });
            console.log(`Success! Status: ${res.status}`);
            const dataStr = JSON.stringify(res.data);
            console.log(`Data Length: ${dataStr.length}`);
            console.log(`Preview: ${dataStr.substring(0, 200)}...`);

            // key check for "ai", "summary", "overview", "genereret"
            if (dataStr.toLowerCase().includes("ai") || dataStr.toLowerCase().includes("overview") || dataStr.toLowerCase().includes("summary")) {
                console.log("POTENTIAL AI CONTENT FOUND!");
            }
        } catch (e: any) {
            console.log(`Failed: ${url} - ${e.message}`);
        }
    }
}

probe();

