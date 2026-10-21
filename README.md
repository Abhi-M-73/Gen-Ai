A simple terminal-based AI chatbot built with **Node.js**, **Groq API**, `groq-sdk`, `readline-sync`, and `dotenv`.

The chatbot accepts messages from the terminal, sends them to a Groq-hosted language model, streams the response back to the terminal, and keeps conversation history during the current run.

## Features

- Terminal input using `readline-sync`
- AI responses through the Groq API
- Streaming output, so the response prints as it arrives
- Conversation history using a `messages` array
- System context to guide the AI's role, tone, and response style
- `.env` file for API-key configuration
- TypeScript-style ES module imports in JavaScript (`import` syntax)
- Type `exit` to end the chat

## Requirements

Install these first:

- **Node.js** (a current LTS version is recommended)
- **npm** (included with Node.js)
- A **Groq account** and a Groq API key
- A terminal such as PowerShell, Command Prompt, or a VS Code terminal

Check that Node.js and npm are installed:

```bash
node -v
npm -v
```

## 1. Create the project

```bash
mkdir groq-terminal-ai
cd groq-terminal-ai
npm init -y
```

Install the required packages:

```bash
npm install groq-sdk readline-sync dotenv
```

### What each package does

| Package | Purpose |
| --- | --- |
| `groq-sdk` | Official JavaScript SDK used to call Groq's chat-completions API |
| `readline-sync` | Reads a message typed into the terminal |
| `dotenv` | Loads environment variables from the `.env` file |
| `node` | Runs the JavaScript program; installed separately from npm packages |

## 2. Configure ES modules

This project uses `import` statements. In `package.json`, add `"type": "module"` at the top level. For example:

```json
{
  "name": "groq-terminal-ai",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  }
}
```

Keep any other fields npm generated if you need them; the important setting for this code is `"type": "module"`.

## 3. Get a Groq API key

1. Open the [Groq Console](https://console.groq.com/).
2. Sign in or create an account.
3. Find the API keys section and create a key if your account has access.
4. Copy the key and store it privately.

API availability, free usage, model availability, and rate limits can change. Check your Groq Console for the current limits and available models.

## 4. Add the environment variable

Create a file named **`.env`** in the project root:

```env
GROQ_API_KEY=put_your_real_api_key_here
```

Replace the example value with your own key. Do not put quotes around it unless your key format requires them, and do not share the key publicly.

Create a **`.gitignore`** file:

```gitignore
node_modules/
.env
```

This helps prevent accidentally committing your API key or installed dependencies to Git.

## 5. Create `index.js`

Use this complete example:

```js
import readline from "readline-sync";
import { Groq } from "groq-sdk";
import { config } from "dotenv";

config();

if (!process.env.GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY. Add it to your .env file.");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// System context: instructions that guide the assistant's responses.
const messages = [
  {
    role: "system",
    content: `
You are a concise and direct AI assistant. You are expert in javascript and nodejs.

Rules:
- Answer exactly what the user asks.
- Do not add unnecessary introductions or conclusions.
- Avoid filler words and repetitive explanations.
- Do not repeat the user's question.
- Use simple English unless the user asks for another language.
- For coding questions, provide correct code and only the necessary explanation.
- If a short answer is enough, give a short answer.
- Never add unrelated information.
`,
  },
];

async function startAI() {
  console.log("Groq AI chatbot started. Type 'exit' to quit.");

  while (true) {
    const input = readline.question("\nYou: ").trim();

    if (input.toLowerCase() === "exit") {
      console.log("AI: Bye!");
      break;
    }

    if (!input) {
      continue;
    }

    // Add the user's message to the conversation history.
    messages.push({
      role: "user",
      content: input,
    });

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: "openai/gpt-oss-120b",
        temperature: 0.3,
        max_completion_tokens: 2048,
        top_p: 1,
        stream: true,
        reasoning_effort: "medium",
      });

      process.stdout.write("\nAI: ");
      let assistantReply = "";

      // Read and print each streamed chunk.
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content ?? "";
        process.stdout.write(content);
        assistantReply += content;
      }

      process.stdout.write("\n");

      // Save the assistant's reply so the next request has context.
      messages.push({
        role: "assistant",
        content: assistantReply,
      });
    } catch (error) {
      // Remove the failed user message so it is not kept in history.
      messages.pop();
      console.error("\nGroq API error:", error.message);
    }
  }
}

startAI().catch((error) => {
  console.error("Unexpected error:", error.message);
  process.exitCode = 1;
});
```

> **Model note:** `openai/gpt-oss-120b` is the model ID used in this example, based on the code supplied for this project. Model IDs and access can change. If Groq reports that the model is unavailable, choose a currently supported model from your Groq Console or Groq model documentation and update the `model` value.

## 6. Run the chatbot

From the project directory:

```bash
npm start
```

Or run the file directly:

```bash
node index.js
```

Example session:

```text
Groq AI chatbot started. Type 'exit' to quit.

You: What is Node.js?
AI: Node.js is a JavaScript runtime that lets you run JavaScript outside a browser.

You: Explain it in one line.
AI: Node.js lets JavaScript run on your computer or server.

You: exit
AI: Bye!
```

Responses vary by model, prompt, and generation settings.

## How the code works

### 1. Import the packages

```js
import readline from "readline-sync";
import { Groq } from "groq-sdk";
import { config } from "dotenv";
```

- `readline-sync` reads terminal input.
- `Groq` creates a client for Groq API requests.
- `config` loads `.env` variables into `process.env`.

### 2. Load environment variables

```js
config();
```

This loads the `GROQ_API_KEY` value from `.env`.

### 3. Create the Groq client

```js
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
```

The SDK uses this key to authenticate API requests. Keep the key secret.

### 4. Set the system context

```js
{
  role: "system",
  content: "You are a concise and helpful AI assistant..."
}
```

The system message sets the assistant's instructions, such as tone, language, and answer length. It guides the model but does not permanently train it.

### 5. Read user input

```js
const input = readline.question("\nYou: ").trim();
```

The program waits for a message in the terminal. `.trim()` removes extra whitespace at the beginning and end.

### 6. Stop when the user types `exit`

```js
if (input.toLowerCase() === "exit") {
  break;
}
```

`toLowerCase()` makes the check case-insensitive, so `exit`, `EXIT`, and `Exit` all work.

### 7. Maintain conversation history

```js
messages.push({
  role: "user",
  content: input,
});
```

The program adds the user's message to the `messages` array. After the response, it adds the assistant's message too. Sending the accumulated array lets the model use earlier messages as context.

**Important:** This history exists only in memory while the program runs. It is not saved to a database or file, and a long conversation can use many tokens. For a larger application, consider limiting or summarizing old messages.

### 8. Send a request to Groq

```js
const chatCompletion = await groq.chat.completions.create({
  messages,
  model: "openai/gpt-oss-120b",
  temperature: 0.3,
  max_completion_tokens: 2048,
  top_p: 1,
  stream: true,
  reasoning_effort: "medium",
});
```

- `messages`: system context and conversation history.
- `model`: the model to request from Groq.
- `temperature`: controls response variability. A lower value often makes output more consistent, but does not guarantee factual accuracy or eliminate extra words.
- `max_completion_tokens`: limits the maximum completion length supported by the model/API.
- `top_p`: another sampling setting; usually best to adjust either `temperature` or `top_p`, not both.
- `stream: true`: returns the response in chunks as it is generated.
- `reasoning_effort`: a model-specific reasoning setting; only use it if the selected model supports it.

### 9. Print the streamed answer

```js
for await (const chunk of chatCompletion) {
  const content = chunk.choices[0]?.delta?.content ?? "";
  process.stdout.write(content);
  assistantReply += content;
}
```

The loop reads each streamed chunk. `process.stdout.write()` prints text without adding a newline after every chunk, so the answer appears continuously. `assistantReply` collects the complete text for chat history.

### 10. Handle errors

The `try/catch` block reports API errors, such as invalid credentials, rate limits, network failures, or unavailable models. Check the error message and your Groq Console for details.

## Useful configuration changes

### Make answers shorter

Edit the system prompt:

```text
- Answer in 1–3 sentences unless more detail is requested.
- Start directly with the answer.
- Do not add greetings, filler, or a conclusion unless useful.
```

You can also lower `max_completion_tokens`, but setting it too low may cut off useful answers.

### Change the model

Replace the `model` value with an ID currently supported by your Groq account. Check the [Groq documentation](https://console.groq.com/docs) for current model IDs and API details.

### Add more context

Add project-specific information to the system message or include relevant information in user messages. For private or large knowledge bases, use a retrieval approach rather than putting every document into every request.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `GROQ_API_KEY` is missing | Confirm `.env` is in the project root and the variable name matches exactly |
| Authentication error | Create or copy a valid key in Groq Console; never publish it |
| Model not found or unavailable | Select a model currently supported by your account |
| Rate limit error | Check account limits and retry policy in Groq Console |
| `Cannot use import statement outside a module` | Add `"type": "module"` to `package.json` |
| AI response has too much extra text | Tighten the system prompt; try a lower temperature |
| Conversation becomes slow or too long | Limit or summarize old messages |

## Security notes

- Never commit `.env` to Git.
- Never expose the API key in frontend/browser code.
- If you later connect a React frontend, keep Groq API calls on your Node.js backend.
- Do not put secrets in public repositories or screenshots.
- Review the provider's current pricing, rate limits, and data policies before using the chatbot with sensitive information.

## References

- [Groq Console](https://console.groq.com/)
- [Groq API documentation](https://console.groq.com/docs)
- [Groq JavaScript SDK](https://github.com/groq/groq-typescript)
- [Node.js documentation](https://nodejs.org/en/docs)
- [dotenv on npm](https://www.npmjs.com/package/dotenv)
- [readline-sync on npm](https://www.npmjs.com/package/readline-sync)
"""
path = Path("/mnt/data/README.md")
path.write_text(content, encoding="utf-8")
print(f"Created {path} ({path.stat().st_size} bytes)")
