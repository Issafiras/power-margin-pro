
import axios from "axios";
import fs from "fs/promises";
import path from "path";

const API_KEY = "5118fae403msh1e5dfafa90fc5bcp1f4445jsnab35514cde0e";
const API_HOST = "cpu-data.p.rapidapi.com";
const BASE_URL = "https://cpu-data.p.rapidapi.com/cpus";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(url: string, params: any = {}, retries = 3): Promise<any> {
    try {
        const response = await axios.get(url, {
            params,
            headers: {
                "x-rapidapi-key": API_KEY,
                "x-rapidapi-host": API_HOST
            }
        });
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.status === 429 && retries > 0) {
            console.warn(`Rate limit hit. Waiting 5s... (${retries} retries left)`);
            await delay(5000);
            return fetchWithRetry(url, params, retries - 1);
        }
        throw error; // Rethrow other errors
    }
}

async function fetchCpus() {
    console.log("Fetching CPU data from RapidAPI (Smart Mode)...");

    // Strategy: Search by brand, assume 'offset' works for pagination
    // Queries: intel, amd, apple, qualcomm
    const queries = ["intel", "amd", "apple", "qualcomm"];
    const allCpus = new Map<string, any>();

    for (const query of queries) {
        console.log(`--- Fetching ${query} ---`);
        let offset = 0;
        let hasMore = true;
        const limit = 10; // API seems locked at 10?

        // Safety break to prevent infinite loops if offset is ignored
        let loopCount = 0;
        const MAX_LOOPS = 5; // Start small to verify pagination works

        while (hasMore && loopCount < MAX_LOOPS) {
            try {
                // Try to use 'offset' if supported, otherwise maybe it's just raw?
                // Note: User doc didn't mention offset.
                // We'll try just sending 'name' first.
                // If we get same data every time, pagination failed.

                const data = await fetchWithRetry(BASE_URL, { name: query }); // removed offset if not supported
                // Wait, if I can't paginate, I can't paginate.
                // But let's assume I can't paginate for now and just get the top 10 matches.
                // Actually, if we search "i9", "i7", "i5", "ryzen 9", etc. we can get more specific chunks.

                if (Array.isArray(data)) {
                    console.log(`Got ${data.length} items for ${query}`);
                    let newItems = 0;
                    for (const cpu of data) {
                        if (cpu.CPU_Name && !allCpus.has(cpu.CPU_Name)) {
                            allCpus.set(cpu.CPU_Name, cpu);
                            newItems++;
                        }
                    }

                    if (newItems === 0) {
                        console.log("No new items found. Pagination likely not supported or exhausted.");
                        hasMore = false;
                    } else {
                        // Proceed? Only if we have a way to pginate.
                        // Since we don't know pagination, we just stop after one fetch per query.
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }

                await delay(1000); // Be gentle
                loopCount++;

            } catch (error: any) {
                console.error(`Error fetching ${query}:`, error.message);
                hasMore = false;
            }
        }
    }

    // Additional specific searches to broaden the dataset given the 10-item limit
    const specificQueries = [
        "core i9", "core i7", "core i5", "core i3",
        "ryzen 9", "ryzen 7", "ryzen 5", "ryzen 3",
        "m1", "m2", "m3", "m4",
        "snapdragon x", "threadripper", "xeon", "epyc"
    ];

    for (const sq of specificQueries) {
        try {
            console.log(`Fetching specific: ${sq}...`);
            const data = await fetchWithRetry(BASE_URL, { name: sq });
            if (Array.isArray(data)) {
                for (const cpu of data) {
                    if (cpu.CPU_Name) allCpus.set(cpu.CPU_Name, cpu);
                }
                console.log(`Total CPUs now: ${allCpus.size}`);
            }
            await delay(1500);
        } catch (e: any) {
            console.error(`Failed ${sq}: ${e.message}`);
        }
    }

    const uniqueCpus = Array.from(allCpus.values());
    console.log(`Total unique CPUs fetched: ${uniqueCpus.length}`);

    if (uniqueCpus.length > 0) {
        let sqlContent = `-- CPU Benchmarks Data\n`;
        sqlContent += `INSERT INTO cpu_benchmarks (id, cpu_name, score, rank, samples, url) VALUES\n`;

        const values: string[] = [];

        for (const cpu of uniqueCpus) {
            const name = cpu.CPU_Name;
            const score = cpu.CPU_Mark; // Note: Check case, sample said CPU_Mark

            if (!name || !score || score === "NA") continue;

            const safeName = name.replace(/'/g, "''").trim();
            const id = safeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const rank = "NULL";
            const samples = "NULL";
            const url = `https://www.cpubenchmark.net/cpu.php?cpu=${encodeURIComponent(name)}`;

            values.push(`('${id}', '${safeName}', ${score}, ${rank}, ${samples}, '${url}')`);
        }

        if (values.length > 0) {
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
            sqlContent += `ON CONFLICT (cpu_name) DO UPDATE SET score = EXCLUDED.score, updated_at = now();`;

            const outputPath = path.join("server", "scripts", "cpu_data.sql");
            await fs.writeFile(outputPath, sqlContent);
            console.log(`SQL file generated: ${outputPath} with ${values.length} entries.`);
        }
    }
}

fetchCpus();
