import { createClient } from "@supabase/supabase-js";
import { Database } from "../_lib/database.ts";
import { processMarkdown } from "../_lib/markdown-parser.ts";

// Supabase Edge function to process the uploaded document
// Edge functions are similar to AWS Lambda functions or Cloudflare Workers

// This function will be triggered by the storage bucket trigger
// It will process the document and save the sections to the database
// Utility functions like markdown, xls etc parsers are mapped here

// These are automactically injected for you by supabase
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

  // ----------------- AUTHORIZATION -----------------
  // Get the JWT token from frontend and inherit the user permissions to the edge function
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
      // Ignore cookies etc
      persistSession: false,
    },
  });

  // ----------------- GET RAWDOCUMENT -----------------
  const { document_id } = await req.json();

  const { data: document } = await supabase
    .from("documents_with_storage_path")
    .select() // same as select('*')
    .eq("id", document_id)
    .single(); // return 1 result, not wrapped into array

  // If the document is not found, return an error
  // This is a sanity check to ensure the document exists
  if (!document?.storage_object_path) {
    return new Response(
      JSON.stringify({ error: "Failed to find uploaded document" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { data: file } = await supabase.storage
    .from("files")
    .download(document.storage_object_path);

  if (!file) {
    return new Response(
      JSON.stringify({ error: "Failed to download storage object" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ----------------- PROCESS DOCUMENT -----------------
  // Handle different file types here
  const fileContents = await file.text();
  const processedMd = processMarkdown(fileContents);

  const { error } = await supabase.from("document_sections").insert(
    processedMd.sections.map(({ content }) => ({
      document_id,
      content,
    }))
  );

  // ----------------- PROCESSING ERROR -----------------
  if (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to save document sections" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ----------------- PROCESSING COMPLETE -----------------
  console.log(
    `Saved ${processedMd.sections.length} sections for file '${document.name}'`
  );

  return new Response(null, {
    status: 204,
    headers: { "Content-Type": "application/json" },
  });
});
