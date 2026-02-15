
import "dotenv/config";
import { client } from "../db";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
    console.log("Seeding CPU benchmarks...");
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is missing");
        }

        const sqlPath = path.join(__dirname, "cpu_data.sql");

        try {
            await fs.access(sqlPath);
        } catch {
            console.error(`SQL file not found at ${sqlPath}. Run fetch_cpus.ts first.`);
            process.exit(1);
        }

        console.log(`Reading SQL from ${sqlPath}`);

        // Execute the SQL file directly using postgres-js
        await client.file(sqlPath);

        console.log("Seeding completed successfully.");
    } catch (error) {
        console.error("Error seeding CPU benchmarks:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seed();
