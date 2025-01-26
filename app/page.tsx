import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function Index() {
  const cookeStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookeStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="w-full flex flex-col items-center relative">
      <video
        src="https://cdn.pixabay.com/video/2023/10/12/184734-873923034_large.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 z-0 w-[100vw] -mt-[53px] h-[100vh] object-cover"
      />
      <div className="flex flex-col gap-14 max-w-4xl px-3 py-16 lg:py-24 text-foreground relative z-10">
        <div className="flex flex-col items-center mb-4 lg:mb-12">
          <h1 className="sr-only">AI Assistant</h1>

          <p className="text-3xl lg:text-5xl tracking-tightest mx-auto max-w-xl text-center my-12">
            Unlock the power of data
          </p>
          {user ? (
            <div className="flex flex-row gap-2">
              <Link
                href="/files"
                className="bg-foreground py-3 px-6 rounded-lg font-mono text-sm text-background"
              >
                Upload your own documents
              </Link>
              <Link
                href="/chat"
                className="bg-foreground py-3 px-6 rounded-lg font-mono text-sm text-background"
              >
                Chat with the AI Assistant
              </Link>
            </div>
          ) : (
            <div className="flex flex-row gap-2">
              <Link
                href="/login"
                className="bg-foreground py-3 px-6 rounded-lg font-mono text-sm text-background"
              >
                Let's get started
              </Link>
            </div>
          )}
        </div>
        <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
      </div>
    </div>
  );
}
