
import axios from 'axios';

const url = "https://www.power.dk/sammenlign/?id=4188966&id=4150738";

async function fetchHtml() {
    try {
        console.log(`Fetching: ${url}`);
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        const html = res.data;
        console.log(`HTML Length: ${html.length}`);

        // Search for keywords
        const keywords = ["AI-genereret", "oversigt", "sammenligning", "fordele", "ulemper"];
        for (const kw of keywords) {
            const index = html.indexOf(kw);
            if (index !== -1) {
                console.log(`Found keyword '${kw}' at index ${index}`);
                console.log(`Context: ${html.substring(index - 50, index + 100).replace(/\n/g, ' ')}`);
            } else {
                console.log(`Keyword '${kw}' not found`);
            }
        }
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }
}

fetchHtml();
