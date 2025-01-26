import { createClient } from "@supabase/supabase-js";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { codeBlock } from "common-tags";
import { OpenAI } from "openai"; // Corrected import statement
import { Database } from "../_lib/database.ts"; // Removed the .ts extension for consistency
import { tavily } from "npm:@tavily/core";

// ================= WEB SEARCH CONFIG =================
const SEARCH_URL = undefined; // Set to undefined for general web search
const MAX_RESULTS = 5;
const INCLUDE_IMAGES = true;
const LEVEL_OF_DETAIL = "basic"; // "basic" or "advanced"

// ================= LLM AGENT CONFIG =================

const MODEL = "gpt-4o"; //gpt-4o-mini
const MAX_TOKENS = 1024; // If you don't need the full 16,000 tokens for your use case, you can set a lower value to potentially reduce costs and improve response times.
const TEMPERATURE = 0; // 0 is the default value, it controls the randomness of the output. Lower values make the output more deterministic and consistent, while higher values make the output more creative and varied.
const SIMILARITY_THRESHOLD = 0.6; // match threshold is a float between 0 and 1
const MAX_DOCUMENTS = 5; // Send top X matching documents to the LLM to ensure it will fit into the context window
const AGENT_BASE_PROMPT = `
You're a friendly chat bot working for https://iii.org helping users with insurance questions. You can small talk with the user and ask follow up questions to get more information.

You need to answer the questions primarily based on the data from the documents below.

If the result was found, respond by starting: 'Based on our documents, ". Attach 'Source:' with the name of the documents that were used to answer the question.

If the result was not found from the documents, search the https://iii.org website for the answer. 

If the result from https://iii.org was found, respond with the result with a prefix: 'Here is the information I found on the iii.org website:'. Attach source URL at the end of the response with 'Source:'.

If you did not find the answer, respond: 'No results found. Please try another question or contact our support at support@company.com.'"

Do not go off topic.

Responses are formatted as plain text.
`;

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

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

  // embedding describes the embedding of the user prompt
  // messages is the history of the conversation
  const { messages, embedding } = await req.json();

  // =========== SEARCH WEBSITE FOR THE MOST UP TO DATE INFORMATION ===========

  const searchWeb = async () => {
    try {
      console.log("----------- WEB_AGENT -------------");
      // Instantiating TavilyClient
      const tvly = tavily(
        {
          apiKey: Deno.env.get("TAVILY_API_KEY"),
          searchUrl: SEARCH_URL,
          maxResults: MAX_RESULTS,
          includeImages: INCLUDE_IMAGES,
          level: LEVEL_OF_DETAIL,
        },
        { headers: corsHeaders }
      );
      console.log("TAVILY_CLIENT", tvly);
      console.log("Web search started...");
      // get the latest quer message from the user
      // Note that
      const query = messages[messages?.length - 1];
      if (!query) {
        console.warn("WEB_AGENT: No query found");
        return "No results found";
      }
      const searchResult = await tvly.search(query);

      console.log("WEB_AGENT: Search Result", searchResult);

      return searchResult.answer;
    } catch (error) {
      console.error("WEB_AGENT: Web search error:", error);
      return "Something went wrong, please try again later or reach out to our support at support@company.com";
    }
  };

  // =========== MATCH DOCUMENTS RELATED TO USER PROMPT ============
  const searchRelatedDocuments = async () => {
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

    console.log("CHAT_AGENT: Context documents found:", documents?.length);

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

    return await openai.chat.completions.create({
      model: MODEL,
      messages: completionMessages,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      stream: true,
    });
  };

  //let completionStream;
  // Step 1 try to search the web real-time for the answer for most up to date information
  // const webSearchResult = await searchWeb();
  // if (webSearchResult) {
  //   return "Here is what I found at iii.org: " + webSearchResult;
  // } else {
  // Step 2 if the web search result is null, search the database for the answer
  const completionStream = await searchRelatedDocuments();
  const stream = OpenAIStream(completionStream);
  return new StreamingTextResponse(stream, { headers: corsHeaders });
});
