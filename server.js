import readline from "readline-sync";
import { Groq } from 'groq-sdk';
import { config } from "dotenv";

config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let messages = [{
    role: "system",
    content: `
You are a concise and direct AI assistant. You are expert in javascript and nodejs.

Rules:
- Answer exactly what the user asks.
- Do not add unnecessary introductions or conclusions.
- Avoid filler words and repetitive explanations.
- Do not repeat the user's question.
- Use simple Hinglish unless the user asks for another language.
- For coding questions, provide correct code and only the necessary explanation.
- If a short answer is enough, give a short answer.
- Never add unrelated information.
`
}];

while (true) {
    const input = readline.question("User: ");
    if (input.toLowerCase() === "exit") {
        break;
    }

    if (!input.trim()) {
        continue;
    }

    messages.push({ role: "user", content: input });
    try {
        const chatCompletion = await groq.chat.completions.create({
            "messages": messages,
            "model": "openai/gpt-oss-120b",
            "temperature": 1,
            "max_completion_tokens": 2048,
            "top_p": 1,
            "stream": true,
            "reasoning_effort": "medium",
            "stop": null
        });
        process.stdout.write("\nAI: ");

        let aiResponse = "";
        for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || '';
            process.stdout.write(content);
            aiResponse += content;
        }

        console.log("\n");
        messages.push({ role: "assistant", content: aiResponse });
    } catch (error) {
        console.error(error);
        messages.pop();
    }
}








