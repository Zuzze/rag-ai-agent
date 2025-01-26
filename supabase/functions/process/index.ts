import { createClient } from "@supabase/supabase-js";
import { Database } from "../_lib/database.ts";
import { processMarkdown } from "../_lib/markdown-parser.ts";
import { processXls } from "../_lib/xls-parser.ts";
//import { Document } from "npm:@langchain/core/documents";

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

  // ----------------- GET RAW DOCUMENT -----------------
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
  // Pre-processing the file based on the file type to clean up data before saving to db
  console.log("PROCESS: File uploaded", file, document);
  let processed;

  // TODO: Add more supported file types
  const fileContents = await file.text();
  // Markdown
  if (file?.type === "text/markdown") {
    console.log("--------- PROCESS: Processing MD file ---------");

    // @TODO: Deno cannot import @langchain/text-splitters for some reason, needs investigation why
    /*const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 50,
      chunkOverlap: 1,
      separators: ["|", "##", ">", "-"],
    });

    const docOutput = await splitter.splitDocuments([
      new Document({ pageContent: fileContents }),
    ]);

    console.log("LANGCHAIN OUTPUT", docOutput);

    processed = docOutput;
    */
    processed = processMarkdown(fileContents);
  } else if (file?.type === "application/vnd.ms-excel") {
    // XLS
    console.log("--------- PROCESS: Processing XLS file ---------");
    console.log("XLS file contents", fileContents);

    processed = processXls(fileContents);
  } else {
    return new Response(
      JSON.stringify({
        error:
          "File type not supported. Currently only Excel files and Markdown files are supported",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { error } = await supabase.from("document_sections").insert(
    processed?.sections?.map(({ content }) => ({
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
  console.log("--------- PROCESS: Processing complete ---------");
  console.log(
    `Saved ${processed.sections.length} sections for file '${document.name}'`
  );

  return new Response(null, {
    status: 204,
    headers: { "Content-Type": "application/json" },
  });
});
