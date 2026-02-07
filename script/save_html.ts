
import axios from 'axios';
import fs from 'fs';

const url = "https://www.power.dk/sammenlign/?id=4188966&id=4150738";

async function saveHtml() {
    try {
        console.log(`Fetching: ${url}`);
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        fs.writeFileSync("comparison_page.html", res.data);
        console.log("Saved to comparison_page.html");

    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }
}

saveHtml();
