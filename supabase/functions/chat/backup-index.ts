/*import { createClient } from "@supabase/supabase-js";
import { Database } from "../_lib/database.ts";
import supervisorAgent, { AgentSystemStatus } from "./supervisor-agent.ts";

// These are automatically injected
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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

  // Only authenticated users can call the API
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

  const { messages, embedding } = await req.json();

  console.log("--------- MESSAGES ---------", messages, embedding);

  async function startMultiAgentSystem(messages: string[]) {
    const graphInstance = supervisorAgent.compile();
    const result = await graphInstance.invoke({
      messages, // Changed 'query' to 'messages' to match the expected properties
      status: AgentSystemStatus.INITIAL,
      supabase,
      embedding,
      corsHeaders,
    });
    console.log("--------- RESULT ---------", result);
  }

  startMultiAgentSystem(messages);
});
*/
