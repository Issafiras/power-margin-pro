
import fs from 'fs';

try {
    const js = fs.readFileSync('main.js', 'utf-8');

    // Find all occurrences of "comparison-ai-summary" and print context
    const flag = "comparison-ai-summary";
    let index = js.indexOf(flag);
    while (index !== -1) {
        console.log(`\nFound '${flag}' at ${index}`);
        console.log(js.substring(index - 200, index + 300));
        index = js.indexOf(flag, index + 1);
    }

    // Find all occurrences of "v2/" to find API calls
    const v2 = "v2/";
    index = js.indexOf(v2);
    let count = 0;
    while (index !== -1 && count < 20) {
        // Look backwards for start of string
        const start = js.lastIndexOf('"', index);
        const end = js.indexOf('"', index);
        if (start !== -1 && end !== -1 && end - start < 100) {
            console.log("Possible API:", js.substring(start + 1, end));
        }
        index = js.indexOf(v2, index + 1);
        count++;
    }

} catch (e: any) {
    console.error(e.message);
}
