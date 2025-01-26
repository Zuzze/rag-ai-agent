"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePipeline } from "@/lib/hooks/use-pipeline";
import { cn } from "@/lib/utils";
import { Database } from "@/supabase/functions/_lib/database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useChat } from "ai/react";
import { FormEvent } from "react";

export default function ChatPage() {
  // Creating singleton under the hood to use same client from the other page
  const supabase = createClientComponentClient<Database>();

  // Perform the inference on the web worker (another thread) to avoid blocking the main thread & UI
  // Also handles async logic under the hood
  const generateEmbedding = usePipeline(
    "feature-extraction",
    `Supabase/${process.env.NEXT_PUBLIC_EMBEDDING_MODEL_NAME}`
  );

  // Use chat is util by Vercel to handle streaming and state management of agent interface
  // To avoid leaking the OpenAPI key, create another edge function to handle the request to OpenAI LLM
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
    });

  // Disable send button while loading
  const isReady = !!generateEmbedding;

  /** Handle sending the message to the agent */
  const handleSend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!generateEmbedding) {
      throw new Error("Unable to generate embeddings");
    }

    const output = await generateEmbedding(input, {
      pooling: process.env.NEXT_PUBLIC_EMBEDDING_POOLING_METHOD,
      normalize: process.env.NEXT_PUBLIC_EMBEDDING_NORMALIZED,
    });
    console.log("Embedding output", output);

    const embedding = JSON.stringify(Array.from(output.data));

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    console.log("User prompt embedded", embedding);

    // Submit data to edge function /chat that will send the request to the LLM (OpenAI)
    handleSubmit(e, {
      options: {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
        body: {
          // This could also be done server side by taking the latest user prompt and embedding it there
          embedding,
        },
      },
    });
  };

  return (
    <div className=" w-full h-full z-0 relative">
      <img
        src="https://cdn.pixabay.com/photo/2019/06/03/23/37/death-valley-4250244_1280.jpg"
        className="absolute left-0 w-full h-[100vh] bg-cover object-cover z-0"
      />
      <div className=" flex flex-col w-full h-full z-10 relative mx-auto py-10">
        <div className="flex mx-auto flex-col w-full gap-6 grow  p-4 sm:p-8 rounded-sm overflow-y-auto mb-12">
          <div className="max-w-6xl mx-auto h-full w-full">
            <div className="border-slate-400 rounded-lg w-full flex flex-col justify-start gap-4 pr-2 grow">
              {messages.map(({ id, role, content }) => (
                <div
                  key={id}
                  className={cn(
                    "rounded-xl bg-white/80 backdrop-blur-lg text-black px-4 py-2 max-w-lg",
                    role === "user"
                      ? "self-end bg-white/30 backdrop-blur-lg"
                      : "self-start"
                  )}
                >
                  {content}
                </div>
              ))}
            </div>
            {isLoading && (
              <div className="self-start m-6 text-gray-500 before:text-gray-500 after:text-gray-500 dot-pulse" />
            )}
            {messages.length === 0 && (
              <div className="self-stretch flex grow  my-20 justify-center">
                <p className="text-white text-5xl">
                  Hi there, How can I help you today?
                </p>
              </div>
            )}
          </div>
          <div className="max-w-6xl w-full mx-auto fixed bottom-10">
            <form
              className="flex items-center space-x-2 gap-2 w-full"
              onSubmit={handleSend}
            >
              <Input
                type="text"
                autoFocus
                placeholder="Send a message"
                value={input}
                onChange={handleInputChange}
              />
              <Button type="submit" disabled={!isReady}>
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
