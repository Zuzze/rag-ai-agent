/*import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { SupabaseClient } from "@supabase/supabase-js";
import webNode from "./web-agent.ts";
import dataNode from "./data-agent.ts";
import { ChatCompletionMessageParam } from "https://esm.sh/openai@4.78.1/resources/index.d.ts";

export enum AgentSystemStatus {
  INITIAL = "initial",
  STEP_1 = "data_search",
  STEP_2 = "web_search",
  COMPLETED = "completed",
  NO_RESULT = "no_result",
  END = "end",
}

export enum AgentNode {
  SUPERVISOR = "supervisor",
  NODE_1 = "data_search",
  NODE_2 = "web_search",
}

export interface AgentSystemState {
  status: AgentSystemStatus;
  messages: ChatCompletionMessageParam[];
  supabase?: SupabaseClient;
  embedding?: number[];
  result?: string | null;
  corsHeaders?: Record<string, string>;
}

// Supervisor Node
const supervisorNode = (state: AgentSystemState) => {
  if (!state.result) {
    return {
      ...state,
      status: "no_result",
    };
  }
  return state;
};

const decideNextStep = (state: AgentSystemState) => {
  console.log("Moving to next step...", state);
  switch (state.status) {
    case AgentSystemStatus.INITIAL:
      return AgentSystemStatus.STEP_1;
    case AgentSystemStatus.STEP_1:
      return state.result
        ? AgentSystemStatus.COMPLETED
        : AgentSystemStatus.STEP_2;
    case AgentSystemStatus.STEP_2:
      return state.result
        ? AgentSystemStatus.COMPLETED
        : AgentSystemStatus.NO_RESULT;
    default:
      return AgentSystemStatus.END;
  }
};

// Define system state interface using Annotation
const GraphAnnotation = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (currentState, updateValue) => currentState.concat(updateValue),
    default: () => [],
  }),
  result: Annotation<string | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),
  status: Annotation<AgentSystemStatus>({
    reducer: (_current, update) => update,
    default: () => AgentSystemStatus.INITIAL,
  }),
  supabase: Annotation<SupabaseClient>({
    reducer: (_current, update) => update,
  }),
});

const supervisorAgentGraph = new StateGraph(GraphAnnotation)
  .addNode(AgentNode.SUPERVISOR, supervisorNode)
  .addNode(AgentNode.NODE_1, dataNode)
  .addNode(AgentNode.NODE_2, webNode)
  .addEdge(START, AgentNode.SUPERVISOR)
  .addConditionalEdges(AgentNode.SUPERVISOR, decideNextStep)
  .addEdge(AgentNode.NODE_1, AgentNode.SUPERVISOR)
  .addEdge(AgentNode.NODE_2, AgentNode.SUPERVISOR)
  .addEdge(AgentNode.SUPERVISOR, END);

export default supervisorAgentGraph;

*/
