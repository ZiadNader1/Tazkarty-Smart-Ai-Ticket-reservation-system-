import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const MODELS = [
    "https://router.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
    "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta", // Old one to compare
    "https://router.huggingface.co/models/google/flan-t5-small" // Highly available backup
];

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

console.log("=== AI Debugger ===");
console.log("Key Prefix:", HF_API_KEY ? HF_API_KEY.substring(0, 5) : "MISSING");

async function testUrl(url) {
    console.log(`\nTesting URL: ${url}`);
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ inputs: "Hello" }),
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Body: ${text.substring(0, 200)}...`);
    } catch (e) {
        console.log(`Failed: ${e.message}`);
    }
}

async function run() {
    for (const url of MODELS) {
        await testUrl(url);
    }
}

run();
