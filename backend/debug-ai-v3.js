import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

const URLS = [
    // OpenAI Compatible on Router?
    {
        url: "https://router.huggingface.co/v1/chat/completions",
        body: {
            model: "HuggingFaceH4/zephyr-7b-beta",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 10
        }
    },
    // Model specific OpenAI endpoint
    {
        url: "https://router.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta/v1/chat/completions",
        body: {
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 10
        }
    }
];

async function test({ url, body }) {
    console.log(`\nTesting: ${url}`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
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
    for (const item of URLS) {
        await test(item);
    }
}

run();
