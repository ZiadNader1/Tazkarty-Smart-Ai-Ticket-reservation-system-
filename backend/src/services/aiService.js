
// src/services/aiService.js

/**
 * Hugging Face API Config
 */
const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HF_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

/**
 * Helper: Sleep function
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper: Call Hugging Face Router API (OpenAI Compatible)
 */
async function queryHuggingFace(messages, maxTokens = 512, retries = 3) {
  if (!HF_API_KEY) {
    throw new Error("Missing HUGGING_FACE_API_KEY in environment variables.");
  }

  const payload = {
    model: HF_MODEL,
    messages: messages,
    max_tokens: maxTokens,
    temperature: 0.7,
    stream: false
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(HF_API_URL, {
        headers: {
          Authorization: `Bearer ${HF_API_KEY} `,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.status === 503) {
        // Model loading logic (might not apply directly to chat completions endpoint, but kept for robustness)
        const errorData = await response.json();
        const estimatedTime = errorData.estimated_time || 20; // Fallback if estimated_time is not provided

        await delay(estimatedTime * 1000);
        continue; // Retry
      }

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Hugging Face API Error: ${response.status} - ${errorDetails} `);
      }

      return await response.json();

    } catch (err) {
      if (i === retries - 1) throw err; // Throw on last attempt

      await delay(2000);
    }
  }
}

/**
 * Generate AI Response
 * Fallback to Local Mock if API fails
 */
export const generateAIResponse = async (userMessage, conversationHistory = [], systemContext = "", lang = "en") => {
  try {
    const isArabic = lang === "ar";
    const roleInstruction = isArabic
      ? "أنتِ 'ندى'، المساعدة الذكية الرسمية لموقع 'تذكرتي' (Tazkarty). سياستك الصارمة: 1. أنتِ موظفة في تذكرتي، ولا تحيلي المستخدم أبداً لمواقع خارجية أو مكاتب خارجية للحجز. 2. كل الحجوزات تتم هنا من خلال موقعنا فقط. 3. إذا سأل المستخدم كيف يحجز، وجهيه لقسم 'القطارات' أو 'الفعاليات' الموجود في شريط التنقل العلوي في موقعنا. 4. استخدمي المعطيات المزودة فقط (Context) ولا تخترعي معلومات. 5. كوني ودودة واستخدمي الإيموجي 🎟️🚆."
      : "You are 'Nada', the official AI assistant for 'Tazkarty'. Policy: 1. You are part of the Tazkarty team. NEVER direct users to external websites or offline offices for booking. 2. All bookings happen right here on our platform. 3. If a user asks how to book, guide them to the 'Trains' or 'Events' section in our navigation bar. 4. Use ONLY the provided context data. 5. Be friendly and use emojis 🎟️🚆.";

    // 1. Construct Messages (OpenAI Format)
    const messages = [
      {
        role: "system",
        content: `${roleInstruction}\n${systemContext}`
      }
    ];

    // Add history (limit to last 10 messages to avoid token limits)
    conversationHistory.slice(-10).forEach(msg => {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    });

    // Add current message
    messages.push({ role: "user", content: userMessage });

    // 2. Call API
    const result = await queryHuggingFace(messages);

    // 3. Extract Response (OpenAI Format)
    let reply = "";
    if (result.choices && result.choices.length > 0) {
      reply = result.choices[0].message.content;
    } else {
      reply = isArabic ? "عذراً، لم أتمكن من صياغة رد حالياً." : "I'm thinking, but I couldn't formulate a response.";
    }

    return reply.trim();

  } catch (error) {
    console.error('Hugging Face AI Error:', error.message);
    return getLocalMockResponse(userMessage, lang);
  }
};

/**
 * Local Fallback (Simulated AI)
 */
function getLocalMockResponse(userMessage, lang = "en") {
  const lowerMsg = userMessage.toLowerCase();
  const isArabic = lang === "ar";

  if (isArabic) {
    if (lowerMsg.includes('اهلا') || lowerMsg.includes('مرحبا') || lowerMsg.includes('سلام')) {
      return "أهلاً بك! أنا ندى. نظام الذكاء الاصطناعي السحابي مشغول حالياً، لذا أنا أرد في الوضع البسيط. كيف يمكنني مساعدتك في الفعاليات أو القطارات اليوم؟";
    }
    if (lowerMsg.includes('قطار') || lowerMsg.includes('اسكندرية') || lowerMsg.includes('اسوان') || lowerMsg.includes('حجز')) {
      return "لحجز قطار، انتقل إلى قسم 'القطارات' في شريط التنقل. يمكنك اختيار وجهتك وتحديد مقاعدك المفضلة هناك!";
    }
    return "أواجه صعوبة في الاتصال بخادمي الخاص. يرجى المحاولة مرة أخرى خلال 30 ثانية. يمكنني مساعدتك في الأسئلة العامة حول المباريات والعروض والقطارات!";
  }

  // Basic pattern matching (English)
  if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
    return "Hello! I'm Nada. The cloud AI is currently busy (likely loading), so I'm replying in basic mode. How can I help you with events or trains today?";
  }
  if (lowerMsg.includes('train') || lowerMsg.includes('alexandria') || lowerMsg.includes('aswan')) {
    return "To book a train, head over to the 'Trains' section in the navigation bar. You can choose your destination and select your preferred seats there!";
  }
  if (lowerMsg.includes('ticket') || lowerMsg.includes('book')) {
    return "To book a ticket for an event or a train, please use our search features or navigate through the categories. (Offline Mode Support)";
  }
  if (lowerMsg.includes('refund') || lowerMsg.includes('cancel')) {
    return "Refunds are allowed up to 48 hours before the event/departure. Check 'My Bookings'. (Offline Mode Support)";
  }

  return "I'm having trouble connecting to my brain (Hugging Face API). Please try again in 30 seconds. I can help with general questions about matches, shows, and trains!";
}

/**
 * Generate Event Recommendations
 */
export const generateEventRecommendations = async (userProfile, events) => {
  try {
    const messages = [
      { role: "system", content: "You are a recommendation engine. Return ONLY a JSON array of event IDs." },
      { role: "user", content: `Based on this profile: ${JSON.stringify(userProfile)} \nRecommend 3 events from: ${JSON.stringify(events.slice(0, 5))} \nReturn ONLY the JSON array of IDs.` }
    ];

    const result = await queryHuggingFace(messages, 200, 1); // maxTokens 200, 1 retry only

    let text = result.choices?.[0]?.message?.content || "[]";
    const match = text.match(/\[.*\]/s);
    return match ? JSON.parse(match[0]) : [];
  } catch (error) {
    console.error('AI Rec Error:', error.message);
    return events.slice(0, 3).map(e => e._id); // Fallback
  }
};

export default { generateAIResponse, generateEventRecommendations };