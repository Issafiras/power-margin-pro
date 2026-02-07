
import fs from 'fs';

const html = fs.readFileSync('comparison_page.html', 'utf-8');
const match = html.match(/<power-meta id="angular-page-model" data="([^"]+)"/);

if (match && match[1]) {
    const base64Data = match[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const jsonStr = buffer.toString('utf-8');

    fs.writeFileSync('comparison_data.json', jsonStr);
    console.log("Decoded data saved to comparison_data.json");

    // Quick peek for keywords
    if (jsonStr.includes("AI") || jsonStr.includes("oversigt")) {
        console.log("Found 'AI' or 'oversigt' in the decoded data!");
    } else {
        console.log("Keywords not found in decoded data.");
    }
} else {
    console.log("Could not find angular-page-model data");
}
