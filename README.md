<h1 align="center">AI Agent for your files</h1>

<p align="center">
Create MVP for securely chatting with your documents using RAG, LLM (OpenAI), and vector database (pgVector extension for Supabase).
</p>

## Features

- **Interactive Chat User Interface:** Interact with your documents, leveraging the capabilities of OpenAI’s GPT models and retrieval augmented generation (RAG) via Vercel's AI SDK.
- **Login With password/<3rd Party>:** Integrate one-click 3rd party login with any of our 18 auth providers and user/password.
- **Document Storage:** Securely upload, store, and retrieve user uploaded documents.
- **Row-level Security:** Secure all of your user data user data with production-ready row-level security.
- **Supabase Edge Functions:** Use Supabase Edge Functions to build a production-ready MVP with /process, /embed, and /chat endpoints.

This repository is built on top of this [this 2h Youtube tutorial from Supabase](https://www.youtube.com/watch?v=ibzlEQmgPPY).

## How to run

1. Clone the repo
2. Run `npm install`
3. Ensure you have a .env.local file in root folder with the following:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

You can get the supabase url and anon key from by running `npx supabase start` in the root folder. Note! This requires you to have a Docker and supabase acocunt.

You also need the .env file in supabase/functions folder with the following API keys (server-side):

```
OPENAI_API_KEY="sk-proj-..."
TAVILY_API_KEY="tvly-..."
```

4. Run `npm run dev` in root folder to open client in localhost:3000
5. Run `npm run edge` to run supabase edge functions in localhost:54321

## Deployed demo version

Coming soon!
