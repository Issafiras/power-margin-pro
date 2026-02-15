
import axios from "axios";

const API_KEY = "5118fae403msh1e5dfafa90fc5bcp1f4445jsnab35514cde0e";
const API_HOST = "cpu-data.p.rapidapi.com";
const BASE = "https://cpu-data.p.rapidapi.com";

async function probe() {
    const endpoints = [
        "/cpus?name=intel",
        "/cpus/search?name=intel",
        "/cpus/search/?name=intel",
        "/cpus/ordered/-cpumark",
        "/cpus/ordered/-cpumark/",
        "/cpus?limit=5",
        "/cpus?page=2"
    ];

    for (const ep of endpoints) {
        try {
            console.log(`Probing: ${ep}`);
            const res = await axios.get(`${BASE}${ep}`, {
                headers: {
                    "x-rapidapi-key": API_KEY,
                    "x-rapidapi-host": API_HOST
                },
                validateStatus: () => true // Don't throw on error
            });
            console.log(`>> Status: ${res.status}`);
            if (res.status === 200 && Array.isArray(res.data)) {
                console.log(`>> Success! Items: ${res.data.length}`);
            } else if (res.status === 200) {
                console.log(`>> Success? (Not array):`, JSON.stringify(res.data).slice(0, 100));
            }
        } catch (e: any) {
            console.log(`>> Error: ${e.message}`);
        }
    }
}

probe();
