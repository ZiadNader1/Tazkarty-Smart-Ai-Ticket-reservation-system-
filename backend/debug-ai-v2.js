import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
console.log("Key:", HF_API_KEY ? "Present" : "Missing");

const URLS = [
    // Standard Router (from error message)
    "https://router.huggingface.co/models/gpt2",
    "https://router.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",

    // Inference Endpoint (Legacy/Redirect?)
    "https://api-inference.huggingface.co/models/gpt2",

    // Router with different path?
    "https://router.huggingface.co/hf-inference/models/gpt2",

    // Google Model
    "https://router.huggingface.co/models/google/flan-t5-small"
];

async function test(url) {
    console.log(`\nTesting: ${url}`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: "Hello" })
        });
        console.log(`Status: ${res.status}`);
        if (!res.ok) {
            console.log(`Error: ${await res.text()}`);
        } else {
            console.log(`Success: ${JSON.stringify(await res.json())}`);
        }
    } catch (err) {
        console.log(`Exception: ${err.message}`);
    }
}

async function run() {
    for (const url of URLS) {
        await test(url);
    }
}

run();
