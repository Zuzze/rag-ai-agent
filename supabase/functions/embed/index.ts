// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "@supabase/supabase-js";
import { Database } from "../_lib/database.ts";

// ----------------- EMBEDDING MODEL CONFIG -----------------
// We could have called 3rd party embedding model here from OpenAI API
// but Supabase Edge functions have built-in feature to generate embeddings directly in the edge function
// ie. model is loaded into the edge function and we can perform inference directly in the edge function
// Transformers.js uses ONNX Runtime to run models in the browser and allows converting pretrainer PyTorch & Tensorflow models to ONNX
// const modelName = Deno.env.get("EMBEDDING_MODEL_NAME");
// const modelNormalized = Deno.env.get("EMBEDDING_NORMALIZED");
// const modelPooling = Deno.env.get("EMBEDDING_POOLING_METHOD");
const model = new Supabase.ai.Session("gte-small");

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(async (req) => {
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

  const { ids, table, contentColumn, embeddingColumn } = await req.json();

  const { data: rows, error: selectError } = await supabase
    .from(table)
    .select(`id, ${contentColumn}` as "*")
    .in("id", ids)
    .is(embeddingColumn, null); // avoid re-embedding already embedded rows

  if (selectError) {
    return new Response(JSON.stringify({ error: selectError }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  for (const row of rows) {
    const { id, [contentColumn]: content } = row;

    if (!content) {
      console.error(`No content available in column '${contentColumn}'`);
      continue;
    }

    const output = (await model.run(content, {
      // embeddings are in practice generated for tokens so to be able to get the embedding of the sentence/row
      // => pool the embeddings into one embedding vector.
      // gte-small uses mean pooling by default so we enable it here as well to take the mean of the token embeddings
      mean_pool: true,
      normalize: true,
    })) as number[];

    const embedding = JSON.stringify(output);

    const { error } = await supabase
      .from(table)
      .update({
        [embeddingColumn]: embedding,
      })
      .eq("id", id);

    if (error) {
      console.error(
        `Failed to save embedding on '${table}' table with id ${id}`
      );
    }

    console.log(
      `Generated embedding ${JSON.stringify({
        table,
        id,
        contentColumn,
        embeddingColumn,
      })}`
    );
  }

  return new Response(null, {
    status: 204,
    headers: { "Content-Type": "application/json" },
  });
});
