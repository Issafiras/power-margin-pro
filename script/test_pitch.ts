
import axios from 'axios';

const mainProduct = {
    id: "4188966",
    name: "Acer Aspire Lite 15,6\" bærbar PC",
    price: 3444,
    specs: { ramGB: 8, storageGB: 256 }
};

const topPick = {
    id: "4150738",
    name: "Acer Aspire Lite AL15-32P-C77Y 15,6\" bærbar pc (Stålgrå)",
    price: 1999,
    specs: { ramGB: 8, storageGB: 128 }
};

async function testPitch() {
    try {
        console.log("Testing /api/generate-pitch...");
        const res = await axios.post('http://localhost:5000/api/generate-pitch', {
            mainProduct,
            topPick
        });

        console.log("Response Status:", res.status);
        console.log("Response Data:", JSON.stringify(res.data, null, 2));
    } catch (e: any) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response:", e.response.data);
        }
    }
}

testPitch();
