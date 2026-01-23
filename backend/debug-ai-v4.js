import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const ENDPOINT = "https://router.huggingface.co/v1/chat/completions";

const CANDIDATES = [
    "mistralai/Mistral-Nemo-Instruct-2407",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "meta-llama/Meta-Llama-3-8B-Instruct",
    "microsoft/Phi-3-mini-4k-instruct",
    "Qwen/Qwen2.5-7B-Instruct"
];

async function testModel(model) {
    console.log(`\nTesting Model: ${model}`);
    try {
        const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: "Hi" }],
                max_tokens: 5
            })
        });

        console.log(`Status: ${res.status}`);
        if (!res.ok) {
            const txt = await res.text();
            // Shorten error to avoid spam
            console.log(`Error: ${txt.substring(0, 150)}...`);
        } else {
            console.log(`✅ SUCCESS! Body: ${JSON.stringify(await res.json())}`);
        }
    } catch (err) {
        console.log(`Exception: ${err.message}`);
    }
}

async function run() {
    for (const m of CANDIDATES) {
        await testModel(m);
    }
}

run();
