const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const oldAI = `const { openai } = await import('@ai-sdk/openai');
                    try {
                        const { text } = await generateText({
                            model: openai('gpt-4o-mini'),
                            prompt: prompt
                        });`;

const newAI = `const { createOpenAI } = await import('@ai-sdk/openai');
                    const openrouter = createOpenAI({
                        baseURL: 'https://openrouter.ai/api/v1',
                        apiKey: process.env.OPENROUTER_API_KEY
                    });
                    try {
                        const { text } = await generateText({
                            model: openrouter('openai/gpt-4o-mini'),
                            prompt: prompt
                        });`;

content = content.replace(oldAI, newAI);
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Updated pipeline.ts to use OpenRouter");
