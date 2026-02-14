import axios from "axios";
import * as cheerio from "cheerio";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const URL = "https://www.notebookcheck.net/Mobile-Graphics-Cards-Benchmark-List.844.0.html?type=&sort=&gpubenchmarks=0&professional=0&dx=0&igpu_restriction=0&multiplegpus=0&showClassDescription=0&deskornote=0&series_uid=0&archive=0&condensed=0&id=0&perfrating=0&or=0&condensed=0&showCount=0&showBars=1&showPercent=0&settings_class_array[]=1&settings_class_array[]=2&settings_class_array[]=3&settings_class_array[]=4&settings_class_array[]=6&settings_class_array[]=7&3dmark13_ice_gpu=1&3dmark13_cloud_gpu=1&3dmark11_gpu=1&3dmark13_fire_gpu=1&3dmark13_time_spy_gpu=1&gpu_fullname=1&architecture=1&pixelshaders=1&vertexshaders=1&corespeed=1&boostspeed=1&memoryspeed=1&memorybus=1&memorytype=1";

async function scrapeGpus() {
    console.log("Fetching GPU data from Notebookcheck...");
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);

        // We confirmed there's only 1 table and the structure is:
        // Col 1: Model
        // Col 13: 3DMark Time Spy (from debug output)
        const modelIndex = 1;
        const timeSpyIndex = 13;

        const table = $("table").first();
        const rows = table.find("tr");

        let sqlContent = `-- GPU Benchmarks Data\n`;
        sqlContent += `INSERT INTO gpu_benchmarks (id, gpu_name, score, url) VALUES\n`;

        const values: string[] = [];

        rows.each((i, row) => {
            // Skip header (Row 0)
            if (i === 0) return;

            const cells = $(row).find("td");
            // Debug showed 14 cols. checks < 14.
            if (cells.length < 14) return;

            const modelCell = $(cells[modelIndex]);
            let gpuName = modelCell.find("a").text().trim() || modelCell.text().trim();
            gpuName = gpuName.replace(/\s+/g, " ").trim();
            gpuName = gpuName.replace(/^\d+\.\s*/, ""); // "1. NVIDIA..." -> "NVIDIA..."

            if (!gpuName || gpuName.toLowerCase() === "model") return;

            const scoreCell = $(cells[timeSpyIndex]);
            const scoreText = scoreCell.text().trim();

            // Parse "24483n21" -> 24483
            // Handle commas if present (English format)
            const scoreMatch = scoreText.match(/^([\d,]+)/);

            if (scoreMatch) {
                let rawScore = scoreMatch[1].replace(/,/g, "");
                let score = parseInt(rawScore, 10);

                // Basic validation: Time Spy score > 100
                if (!isNaN(score) && score > 100) {
                    const safeName = gpuName.replace(/'/g, "''");
                    const id = randomUUID();
                    values.push(`('${id}', '${safeName}', ${score}, '${URL}')`);
                }
            }
        });

        console.log(`Found ${values.length} valid GPUs.`);

        if (values.length > 0) {
            sqlContent += values.join(",\n");
            sqlContent += "\nON CONFLICT (gpu_name) DO UPDATE SET score = EXCLUDED.score, url = EXCLUDED.url, updated_at = now();\n";

            await fs.writeFile("server/scripts/gpu_data.sql", sqlContent);
            console.log("SQL file generated: server/scripts/gpu_data.sql");
        } else {
            console.log("No data found to generate SQL.");
        }

    } catch (error) {
        console.error("Error scraping GPUs:", error);
    }
}

scrapeGpus();
