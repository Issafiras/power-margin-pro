
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

// Main chart for high-end CPUs. We can also add mid/low if needed.
const URLS = [
    "https://www.cpubenchmark.net/high_end_cpus.html",
    "https://www.cpubenchmark.net/mid_range_cpus.html",
    "https://www.cpubenchmark.net/midlow_range_cpus.html",
    "https://www.cpubenchmark.net/low_end_cpus.html"
];

async function scrapeCpus() {
    console.log("Scraping CPU data from cpubenchmark.net...");

    let sqlContent = `-- CPU Benchmarks Data (Scraped)\n`;
    sqlContent += `INSERT INTO cpu_benchmarks (id, cpu_name, score, rank, samples, url) VALUES\n`;

    const values: string[] = [];
    const seenNames = new Set<string>();

    for (const url of URLS) {
        try {
            console.log(`Fetching ${url}...`);
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            const chart = $(".chartlist");
            const rows = chart.find("li");

            console.log(`Found ${rows.length} rows in chart.`);

            rows.each((i, row) => {
                const el = $(row);
                const nameEl = el.find(".prdname");
                const countEl = el.find(".count");

                let name = nameEl.text().trim();
                let scoreText = countEl.text().trim(); // "24,483"

                // Remove price if present in name text (sometimes happens)
                // Actually usually text() is clean.

                // Clean score
                let score = parseInt(scoreText.replace(/,/g, ""), 10);

                if (name && !isNaN(score)) {
                    // Extract URL relative
                    const href = el.find("a").attr("href");
                    const fullUrl = href ? `https://www.cpubenchmark.net/${href}` : url;

                    if (!seenNames.has(name)) {
                        seenNames.add(name);

                        const safeName = name.replace(/'/g, "''").trim();
                        // Consistent ID
                        const id = safeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

                        values.push(`('${id}', '${safeName}', ${score}, NULL, NULL, '${fullUrl}')`);
                    }
                }
            });

        } catch (error: any) {
            console.error(`Error scraping ${url}:`, error.message);
        }
    }

    console.log(`Total unique CPUs scraped: ${values.length}`);

    if (values.length > 0) {
        // Split into chunks of 1000
        const chunkSize = 1000;
        for (let i = 0; i < values.length; i += chunkSize) {
            const chunk = values.slice(i, i + chunkSize);
            if (i === 0) {
                sqlContent += chunk.join(",\n");
            } else {
                sqlContent += `;\n\nINSERT INTO cpu_benchmarks (id, cpu_name, score, rank, samples, url) VALUES\n`;
                sqlContent += chunk.join(",\n");
            }
        }

        sqlContent += ";\n\n";
        sqlContent += `
ON CONFLICT (cpu_name) DO UPDATE SET 
    score = EXCLUDED.score, 
    url = EXCLUDED.url,
    updated_at = now();
`;

        const outputPath = path.join("server", "scripts", "cpu_data.sql");
        await fs.writeFile(outputPath, sqlContent);
        console.log(`SQL file generated: ${outputPath} with ${values.length} entries.`);
    } else {
        console.log("No valid CPU data found.");
    }
}

scrapeCpus();
