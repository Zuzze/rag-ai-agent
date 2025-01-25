import { createClient } from "@supabase/supabase-js";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { codeBlock } from "common-tags";
import OpenAI from "openai";
import { Database } from "../_lib/database.ts";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

// ================= LLM AGENT CONFIG =================

const MODEL = "gpt-4o-mini"; //gpt-4o-mini
const MAX_TOKENS = 1024; // If you don't need the full 16,000 tokens for your use case, you can set a lower value to potentially reduce costs and improve response times.
const TEMPERATURE = 0; // 0 is the default value, it controls the randomness of the output. Lower values make the output more deterministic and consistent, while higher values make the output more creative and varied.
const SIMILARITY_THRESHOLD = 0.8; // match threshold is a float between 0 and 1
const MAX_DOCUMENTS = 5; // Send top X matching documents to the LLM to ensure it will fit into the context window
const AGENT_BASE_PROMPT = `
You're a chat bot, so keep your replies succinct.

You need to answer the questions primarily based on the documents below.

If the information is related to the documents but answer isn't available in the below documents, say:
"Sorry, I couldn't find any information on that in the documents. Would you like me to search outside of the documents?"

If the user responds yes, he want to search outside the documents, search outside the documents and respond with the prefix:
"Here is the information I found outside of the documents: "

Do not go off topic.
`;

// These are automatically injected
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // ================= HANDLE AUTH/CORS =================
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({
        error: "Missing environment variables.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const authorization = req.headers.get("Authorization");

  if (!authorization) {
    return new Response(
      JSON.stringify({ error: `No authorization header passed` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        authorization,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  // =========== MATCH DOCUMENTS RELATED TO USER PROMPT ============

  const { messages, embedding } = await req.json();

  // rpc = remote procedure call from Postgres
  const { data: documents, error: matchError } = await supabase
    .rpc("match_document_sections", {
      embedding,
      match_threshold: SIMILARITY_THRESHOLD,
    })
    .select("content") // select only content column from db
    .limit(MAX_DOCUMENTS); // limit to X documents that have the best match

  if (matchError) {
    console.error(matchError);

    return new Response(
      JSON.stringify({
        error: "There was an error reading your documents, please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const injectedDocs =
    documents && documents.length > 0
      ? documents.map(({ content }) => content).join("\n\n")
      : "No documents found";

  console.log("Context documents", injectedDocs);

  const completionMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    [
      {
        role: "user",
        content: codeBlock`
        You're an AI assistant who answers questions about documents.

        ${AGENT_BASE_PROMPT}

        Documents:
        ${injectedDocs}
      `,
      },
      ...messages,
    ];

  const completionStream = await openai.chat.completions.create({
    model: MODEL,
    messages: completionMessages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    stream: true,
  });

  const stream = OpenAIStream(completionStream);
  return new StreamingTextResponse(stream, { headers: corsHeaders });
});
