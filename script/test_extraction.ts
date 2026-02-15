
import { extractSpecs } from "../server/routes";

const testCases = [
    {
        name: "ASUS Zenbook 14 OLED UX3405MA-PURE9 14\" bærbar computer",
        salesArgs: "Intel Core Ultra 9 185H / 32 GB RAM / 1 TB SSD / 3K 120 Hz OLED touchskærm",
        expected: { cpu: "Intel Core Ultra 9 185H", ramGB: 32, storageGB: 1024 }
    },
    {
        name: "Lenovo Yoga Slim 7 14Q8X9 14\" bærbar computer (Copilot+ PC)",
        salesArgs: "Snapdragon X Elite X1E-78-100 / 32 GB RAM / 1 TB SSD / 14,5\" 3K 90 Hz OLED-touchskærm",
        expected: { cpu: "Snapdragon X Elite X1E-78-100", ramGB: 32, storageGB: 1024 }
    },
    {
        name: "HP Pavilion 15-eg3456ng",
        salesArgs: "Intel Core i5-1335U, 16GB RAM, 512GB SSD, Intel Iris Xe Graphics",
        expected: { cpu: "Intel Core i5-1335U", ramGB: 16, storageGB: 512, gpu: "Intel Iris Xe Graphics" }
    },
    {
        name: "Acer Nitro 5 AN515-58-57Y3",
        salesArgs: "Intel Core i5-12500H / 16 GB RAM / 512 GB SSD / NVIDIA GeForce RTX 4050 6 GB",
        expected: { cpu: "Intel Core i5-12500H", ramGB: 16, storageGB: 512, gpu: "NVIDIA GeForce RTX 4050" }
    },
    // New edge cases
    {
        name: "MSI Titan 18 HX A14VIG-066NE 18\" bærbar computer",
        salesArgs: "Intel Core i9-14900HX / 128 GB RAM / 4 TB SSD / NVIDIA GeForce RTX 4090 16 GB",
        expected: { cpu: "Intel Core i9-14900HX", ramGB: 128, storageGB: 4096, gpu: "NVIDIA GeForce RTX 4090" }
    },
    {
        name: "Future Laptop 2025",
        salesArgs: "Intel Core Ultra 7 268V / 32 GB RAM / 1 TB SSD / NVIDIA GeForce RTX 5080",
        expected: { cpu: "Intel Core Ultra 7 268V", ramGB: 32, storageGB: 1024, gpu: "NVIDIA GeForce RTX 5080" }
    }
];

// Helper to check if specs match loosely
function verify(actual: any, expected: any) {
    let passed = true;
    for (const key of Object.keys(expected)) {
        if (key === 'gpu' && !actual[key]) continue;

        const val = actual[key];
        const expectedVal = expected[key];

        if (typeof val === 'string' && typeof expectedVal === 'string') {
            if (!val.toLowerCase().includes(expectedVal.toLowerCase()) && !expectedVal.toLowerCase().includes(val.toLowerCase())) {
                console.error(`Mismatch formatted: ${key}: Got '${val}', Expected '${expectedVal}'`);
                passed = false;
            }
        } else if (val !== expectedVal) {
            console.error(`Mismatch strict: ${key}: Got ${val}, Expected ${expectedVal}`);
            passed = false;
        }
    }
    return passed;
}

console.log("Running extraction tests...");

testCases.forEach((tc, i) => {
    console.log(`\nTest Case ${i + 1}: ${tc.name}`);
    const extracted = extractSpecs(tc.name, tc.salesArgs);
    const passed = verify(extracted, tc.expected);

    if (passed) console.log("✅ Passed");
    else {
        console.log("❌ Failed");
        console.log("Extracted:", extracted);
    }
});
