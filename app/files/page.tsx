"use client";

import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/supabase/functions/_lib/database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function FilesPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // fetch all uploaded documents to display in the UI
  const {
    data: documents,
    isLoading,
    isError,
  } = useQuery(["files"], async () => {
    const { data, error } = await supabase
      .from("documents_with_storage_path")
      .select();

    // error handling to inform user if fetch failed
    if (error) {
      toast({
        variant: "destructive",
        description: "Failed to fetch documents",
      });
      throw error;
    }

    return data;
  });

  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayError = () => {
    toast({
      variant: "destructive",
      description: "There was an error uploading the file. Please try again.",
    });
    clearFileInput();
  };

  useEffect(() => {
    if (isError) {
      displayError();
    }
  }, [isError]);

  return (
    <div className="object-cover bg-cover bg-no-repeat h-[calc(100vh+53px)] -mt-[53px] bg-[url('https://cdn.pixabay.com/photo/2021/09/19/21/38/nature-6639127_1280.jpg')]">
      <div className="m-4 sm:m-10 flex flex-col gap-8 grow items-stretch ">
        <div className="h-40 flex flex-col justify-center items-center">
          <Input
            type="file"
            name="file"
            ref={fileInputRef}
            key={fileInputRef.current?.name}
            className="cursor-pointer w-full max-w-xs bg-white/50 backdrop-blur-xl rounded-full hover:bg-white hover:text-gray-900"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                // reference the files bucket
                const { error } = await supabase.storage.from("files").upload(
                  // generate a random uuid for the file name to avoid conflicts in case multiple uploaded files have the same name
                  // keep the file name to ensure no data (title) is lost
                  `${crypto.randomUUID()}/${file.name}`,
                  file
                );

                if (error) {
                  displayError();
                } else {
                  toast({
                    variant: "default",
                    description: `File ${file.name} uploaded successfully.`,
                  });
                  clearFileInput();
                }
              }
            }}
          />
        </div>
        {isLoading && (
          <div className="flex justify-center items-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {(!documents || documents.length === 0) && (
          <p className="text-center text-white text-xl text-foreground/50 pt-5">
            No documents uploaded yet.
          </p>
        )}
        {documents && (
          <div className="grid  sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex bg-white/50 backdrop-blur-xl flex-col gap-2 justify-center items-center border rounded-md p-4 sm:p-6 text-center overflow-hidden cursor-pointer hover:bg-slate-100/70"
                onClick={async () => {
                  if (!document.storage_object_path) {
                    toast({
                      variant: "destructive",
                      description: "Failed to download file, please try again.",
                    });
                    return;
                  }

                  // get signed url to download the file
                  // by default buckets are private and only accessible once authenticated
                  // To be able to access the file , we need to create a signed (public) url that will expire
                  // the default expiry is set to 60 seconds as assumption is that user accesses this immediately
                  const { data, error } = await supabase.storage
                    .from("files")
                    .createSignedUrl(document.storage_object_path, 60);

                  if (error) {
                    toast({
                      variant: "destructive",
                      description: "Failed to download file. Please try again.",
                    });
                    return;
                  }

                  // redirect to the signed url to trigger the file download
                  window.location.href = data.signedUrl;
                }}
              >
                <div className="flex flex-row gap-3  justify-between w-full items-center ">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <svg
                      width="50px"
                      height="50px"
                      version="1.1"
                      viewBox="0 0 100 100"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="m82 31.199c0.10156-0.60156-0.10156-1.1992-0.60156-1.6992l-24-24c-0.39844-0.39844-1-0.5-1.5977-0.5h-0.19922-31c-3.6016 0-6.6016 3-6.6016 6.6992v76.5c0 3.6992 3 6.6992 6.6016 6.6992h50.801c3.6992 0 6.6016-3 6.6016-6.6992l-0.003906-56.699v-0.30078zm-48-7.1992h10c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2h-10c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2zm32 52h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm0-16h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm0-16h-32c-1.1016 0-2-0.89844-2-2s0.89844-2 2-2h32c1.1016 0 2 0.89844 2 2s-0.89844 2-2 2zm-8-15v-17.199l17.199 17.199z" />
                    </svg>
                  </div>
                  <p
                    className="text-sm w-full line-clamp-2 text-left"
                    title={document.name ?? ""}
                  >
                    {document.name || "Untitled document"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
