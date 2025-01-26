const WEB_AGENT_MODEL = "gpt-4o";
const WEB_AGENT_TEMPERATURE = 0;
const WEB_AGENT_MAX_TOKENS = 1024;
const WEB_AGENT_NAME = "Web Agent";
const WEB_AGENT_TASK = `use the Tavily search engine to search the website https://www.iii.org/ to answer the given query by the user. 
  If the answer is not found, return 'No results found.'.`;

/* import { createClient } from "@supabase/supabase-js";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { codeBlock } from "common-tags";
import OpenAI from "openai";
import { Database } from "../_lib/database.ts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage } from "@langchain/core/messages";
import {
  END,
  START,
  Annotation,
  messagesStateReducer,
  StateGraph,
} from "@langchain/langgraph";
import { webAgent } from "./web-agent.ts";
import { supervisorAgentGraph } from "./supervisor-agent.ts";
*/
const MODEL = "gpt-4o-mini";
// If you don't need the full (e.g. 16,000 for gpt-4o-mini) tokens for your use case,
// You can set a lower value to potentially reduce costs and improve response times.
// MAX_TOKENS includes both input and output tokens. Limiting tokens will keep the response more concise and easier for the users as well to digest.
const MAX_TOKENS = 1024;
// Temperature controls the "creativity" of the output. 0 gives always the same output for the same input.
// 0 is the default value, it controls the randomness of the output. Lower values make the output more deterministic and consistent, while higher values make the output more creative and varied.
const TEMPERATURE = 0;
// match threshold is a float between 0 and 1
const SIMILARITY_THRESHOLD = 0.8;
// Send top X matching documents to the LLM to ensure it will fit into the context window
const MAX_DOCUMENTS = 5;
// Whether the response should be streamed or not ie. return response of data immediately when some parts ready vs wait until full completion
// For real-time applications, it's better to stream the response
const STREAMED = true;
// The role of the agent
const MAIN_AGENT_NAME = "Supervisor";
// The base prompt to initialize the agent
const MAIN_AGENT_BASE_PROMPT = `
You're a chat bot, so keep your replies succinct.

You need to answer the questions primarily based on the documents below.

If the information is related to the documents but answer isn't available in the below documents, say:
"Sorry, I couldn't find any information on that in the documents. Would you like me to search outside of the documents?"

If the user responds yes, he want to search outside the documents, search outside the documents and respond with the prefix:
"Here is the information I found outside of the documents: "

Do not go off topic.
`;
const SUB_AGENT_1_NAME = "Agent 1";
const SUB_AGENT_1_TASK =
  "Your task is to answer users questions strictly based on the uploaded documents below. If you don't have the answer, delegate the question to ${} ";
const SUB_AGENT_2_NAME = "Agent 2";
const SUB_AGENT_2_TASK = "Agent 2's task";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});
