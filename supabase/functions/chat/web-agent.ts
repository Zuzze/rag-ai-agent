/* import { TavilySearchResults } from "./@langchain/community/tools/tavily_search";
import { AgentSystemState } from "./supervisor-agent.ts";

const SEARCH_URL = "https://www.iii.org/"; // leave as undefined for general web search
const MAX_RESULTS = 5;
const INCLUDE_IMAGES = true;
const LEVEL_OF_DETAIL = "basic"; // "basic" or "advanced"

const webSearchTool = new TavilySearchResults({
  apiKey: Deno.env.get("TAVILY_API_KEY"),
  searchUrl: SEARCH_URL,
  maxResults: MAX_RESULTS,
  includeImages: INCLUDE_IMAGES,
  level: LEVEL_OF_DETAIL,
});

const completeWithoutResult = (state: AgentSystemState) => {
  return {
    ...state,
    result: null,
    status: "no_result",
  };
};

/**
 * Searches answer to user query from a given website.
 */
/*const webNode = async (state: AgentSystemState) => {
  try {
    console.log("----------- WEB_AGENT -------------");
    console.log("Web search started...");
    // get the latest quer message from the user
    // Note that
    const query = state.messages?.[state.messages?.length - 1];
    if (!query) {
      console.warn("WEB_AGENT: No query found");
      return completeWithoutResult(state);
    }
    const searchResult = await webSearchTool.call(query);

    console.log("WEB_AGENT: Search Result", searchResult);

    if (searchResult) {
      return {
        ...state,
        result: searchResult,
        status: "completed",
      };
    }
    console.log("WEB_AGENT: No results found");
    return completeWithoutResult(state);
  } catch (error) {
    console.error("WEB_AGENT: Web search error:", error);
    return completeWithoutResult(state);
  }
};

export default webNode;
*/
