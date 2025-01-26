/*import { OpenAIStream, StreamingTextResponse } from "ai";
import { codeBlock } from "common-tags";
import OpenAI from "openai";
import { AgentSystemState } from "./supervisor-agent.ts";
import { AgentSystemStatus } from "./supervisor-agent.ts";

// Removed the import of TavilySearchResults due to the export error

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

const AGENT_NAME = "Data Agent";
const AGENT_TASK =
  "Your task is to answer users questions strictly based on the uploaded documents below.'";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const completeWithoutResult = (state: AgentSystemState) => {
  return {
    ...state,
    result: null,
    status: AgentSystemStatus.STEP_2,
  };
};

// Local Database Search Node
const dataNode = async (state: AgentSystemState) => {
  try {
    if (!state.supabase) {
      throw new Error("DATA AGENT: Supabase client not found");
    }
    console.log("----------- DATA_AGENT -------------");
    console.log(
      "DATA_AGENT:Matching query embedding with document embeddings..."
    );
    // rpc = remote procedure call from Postgres
    const { data: documents, error: matchError } = await state.supabase
      .rpc("match_document_sections", {
        embedding: state.embedding,
        match_threshold: SIMILARITY_THRESHOLD,
      })
      .select("content") // select only content column from db
      .limit(MAX_DOCUMENTS); // limit to X documents that have the best match

    if (matchError) {
      console.error(matchError);

      return new Response(
        JSON.stringify({
          error:
            "DATA_AGENT: There was an error reading your documents, please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!documents || documents.length === 0) {
      return completeWithoutResult(state);
    }
    const injectedDocs = documents.map(({ content }) => content).join("\n\n");
    const messages = state.messages;

    const completionMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      [
        {
          role: "user",
          content: codeBlock`
        You're an AI assistant who answers questions about documents.

        ${AGENT_TASK}

        If you don't find any results from the attached documents, return 'No results found.'

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
    console.log("DATA_AGENT: Result stream created", stream);
    return {
      ...state,
      result: new StreamingTextResponse(stream, { headers: state.corsHeaders }),
      status: AgentSystemStatus.COMPLETED,
    };
  } catch (error) {
    console.error("DATA_AGENT:", error);
    return completeWithoutResult(state);
  }
};

export default dataNode;
*/
