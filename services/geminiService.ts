
import { GoogleGenAI } from "@google/genai";
import { Resource, Member, AccessLog } from "../types";

export const getLibraryChat = (context: { resources: Resource[], members: Member[], logs: AccessLog[] }) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const resourceList = context.resources
    .map(r => `[${r.type}] ${r.title} by ${r.author}`)
    .join('\n');

  const systemInstruction = `
    You are "Vidya AI", a focused and intelligent concierge for Vidya Library, Sitamarhi.
    
    STRICT RULES:
    1. TOPIC FOCUS: Respond ONLY to the specific query asked. If asked about "Quantum Computers", discuss ONLY Quantum Computers (past, present, future). Do not mention library rules, fee structures, or the library unless it is directly relevant to the user's question.
    2. NO FLUFF: Avoid generic greetings (after the initial one) or unrelated conclusions.
    3. SEARCH GROUNDING: Use Google Search for up-to-date information on academic or technical topics.
    4. CONTEXT: You know about Vidya Library's digital hub which contains:
    ${resourceList}
    
    If the user's question relates to these subjects (e.g., JEE, NEET, SSC), you may suggest checking the hub, but ONLY if it is directly relevant to the topic of their query.
    
    Director: Bablu Kumar.
    Location: Mohanpur Bazar.
    Tone: Professional, expert, and extremely focused.
  `;

  return ai.chats.create({
    model: "gemini-3-pro-preview",
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
    },
  });
};
