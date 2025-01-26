import clipText from "text-clipper";

// Langchain unstructured loaders are not working for JS/deno so using text-clipper instead.
/**
 *     const loader = new UnstructuredLoader(path, {
      apiKey: Deno.env.get("OPENAI_API_KEY")
      strategy: "hi_res",
      ocrLanguages: ["en"],
    });
    return await loader.load();
 */

/**
 * This is a temporary solution knowing the type of data we have and aknowledging it may not be validated HTML.
 * For production, more sophisticated parser is needed
 *
 * OpenAI recommends replacing line breaks with space for better results
 */
const stripHTMLTags = (str: string) =>
  str.replace(/<[^>]*>/g, "").replace(/\r\n/g, " ");

/**
 * Note that this is for excel files that can contain HTML
 * TODO: Add a check to see if the file is too large to be a single chunk like in the markdown parser
 */
export function processXls(content: string, maxSectionLength = 1024) {
  // split excel rows into array
  const rows: string[] = content.split("\n");
  console.log("ROWS", rows);
  const chunks: string[] = [];

  for (const row of rows) {
    const rowWithoutTags = stripHTMLTags(row);
    // ignore rows that are null
    if (rowWithoutTags && rowWithoutTags.length > 0) {
      chunks.push(rowWithoutTags);
    }
  }
  console.log("CHUNKS", chunks);

  // Recursive function to split content based on maxSectionLength
  /*const splitContent = (content: string): string[] => {
    if (content.length <= maxSectionLength) {
      return [content]; // Return the content as a single element array if it's within the limit
    }

    // Find the last space within the maxSectionLength
    const lastSpaceIndex = content.lastIndexOf(" ", maxSectionLength);
    if (lastSpaceIndex === -1) {
      // If no space is found, split at maxSectionLength
      return [
        content.substring(0, maxSectionLength),
        ...splitContent(content.substring(maxSectionLength)),
      ];
    }

    // Split the content at the last space
    const firstPart = content.substring(0, lastSpaceIndex);
    const secondPart = content.substring(lastSpaceIndex + 1); // Skip the space

    return [firstPart, ...splitContent(secondPart)]; // Recursively split the remaining content
  };

  // strip html tags on each row
  if (content.includes("<html>")) {
    for (const row of rows) {
      // Split the section if it exceeds maxSectionLength
      const splitRows = splitContent(row);

      // Add each split section to cleanedDocuments, in most cases this will be a single section
      for (const splitRow of splitRows) {
        sections.push(
          clipText(splitRow, maxSectionLength, {
            html: true,
            stripTags: true,
          })
        );
      }
    }
  } else {
    for (const row of rows) {
      // Split the section if it exceeds maxSectionLength
      const splitRows = splitContent(row);

      // Add each split section to cleanedDocuments, in most cases this will be a single section
      for (const splitRow of splitRows) {
        sections.push(clipText(splitRow, maxSectionLength));
      }
    }
  }*/

  return {
    sections: [{ content: chunks.join("\n") }],
  };
}
