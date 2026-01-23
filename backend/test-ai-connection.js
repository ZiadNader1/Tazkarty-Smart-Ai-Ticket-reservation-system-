import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const HF_API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;

console.log("Testing Hugging Face API Connection...");
console.log("API Key present:", !!HF_API_KEY);
if (HF_API_KEY) {
    console.log("API Key prefix:", HF_API_KEY.substring(0, 5) + "...");
}

async function testConnection() {
  try {
    const payload = {
        inputs: "<|user|>\nHello, are you working?</s>\n<|assistant|>\n",
        parameters: { max_new_tokens: 20 }
    };

    const response = await fetch(HF_API_URL, {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log("\nResponse Status:", response.status);
    
    if (!response.ok) {
        const text = await response.text();
        console.error("❌ API Error Body:", text);
    } else {
        const json = await response.json();
        console.log("✅ Success! Response:", JSON.stringify(json, null, 2));
    }

  } catch (error) {
    console.error("❌ Connection Error:", error.message);
  }
}

testConnection();
