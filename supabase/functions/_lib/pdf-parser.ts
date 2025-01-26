import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export const processPdf = async (path: string) => {
  const loader = new PDFLoader(path);
  const docs = await loader.load();
  console.log("PDF loader", docs[0]);
  return docs[0];
};
