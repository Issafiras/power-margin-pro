
import axios from 'axios';
import fs from 'fs';

const jsUrl = "https://www.power.dk/frontend/dist/browser/main-CICSHJBN.js";

async function downloadJs() {
    try {
        const res = await axios.get(jsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        fs.writeFileSync('main.js', res.data as string);
        console.log("Saved main.js");
    } catch (e: any) {
        console.error(e.message);
    }
}

downloadJs();
