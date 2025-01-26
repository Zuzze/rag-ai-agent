"use client";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/supabase/functions/_lib/database";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

export default function FilesPage() {
  const supabase = createClientComponentClient<Database>();
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
    <div className="object-cover bg-cover bg-no-repeat h-full overflow-hidden top-0 left-0 w-full bg-[url('https://cdn.pixabay.com/photo/2021/09/19/21/38/nature-6639127_1280.jpg')]">
      <div className="p-4 pb-0 sm:p-10 sm:pb-0 flex flex-col gap-8 grow items-stretch overflow-y-auto h-full">
        <div className="h-40 pt-10 flex flex-col justify-center items-center">
          <Input
            type="file"
            name="file"
            accept=".xls,.md,"
            multiple
            ref={fileInputRef}
            key={fileInputRef.current?.name}
            className="cursor-pointer w-full max-w-xs bg-white/50 backdrop-blur-xl rounded-full hover:bg-white hover:text-gray-900"
            onChange={async (e) => {
              console.log("FILES", e.target.files);
              for (const file of Array.from(e.target.files ?? [])) {
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
              }
            }}
          />
        </div>
        {isLoading && (
          <div className="flex justify-center items-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {(!documents || documents.length === 0) && !isLoading && (
          <p className="text-center text-white text-xl text-foreground/50 pt-0">
            No documents uploaded yet.
          </p>
        )}
        {documents && (
          <div className="grid pb-10 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex min-h-40 bg-white/50 backdrop-blur-xl flex-col gap-2 justify-center items-center border rounded-md p-4 sm:p-6 text-center overflow-hidden cursor-pointer hover:bg-slate-100/70"
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
                    <img
                      src={
                        document.name?.endsWith(".md")
                          ? "https://icon-library.com/images/text-icon-png/text-icon-png-8.jpg"
                          : "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg/1024px-Microsoft_Office_Excel_%282019%E2%80%93present%29.svg.png"
                      }
                      alt="file type"
                      style={{ width: "100%", height: "auto" }}
                    />
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
