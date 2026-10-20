const GROQ_API_KEY = "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"; 
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface ExpiryAiResult {
  expiry_date: string | null;
}

export async function extractExpiryDateFromImage(base64Image: string): Promise<ExpiryAiResult> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          {
            role: "system",
            content: "You are a precise data extraction assistant. Look at the provided image of a product label or receipt and find the expiry date, best-by date, or use-by date. You must return ONLY a raw valid JSON object with the exact key 'expiry_date' in format 'YYYY-MM-DD'. If no expiry date can be found or read, return {\"expiry_date\": null}. Do not include any conversational text or markdown code blocks."
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              },
              {
                type: "text",
                text: "Extract the expiry date from this image into the required JSON format."
              }
            ]
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { expiry_date: null };
    }

    const parsed: ExpiryAiResult = JSON.parse(content);
    return parsed;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
}

export async function analyzeIngredientsFromImage(base64Image: string): Promise<string> {
  try {
    const apiKey = GROQ_API_KEY; 
    if (!apiKey) {
      throw new Error('Groq API Key missing');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze the ingredient list in this image. List all detected ingredients clearly, highlight any common allergens (like dairy, nuts, gluten, soy), and provide a concise 2-sentence health summary of key additives or preservatives present.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No ingredients detected. Please ensure the label is clearly visible.';
  } catch (error) {
    console.error('Failed to analyze ingredients:', error);
    return 'Failed to analyze ingredients with AI service. Please try again.';
  }
}