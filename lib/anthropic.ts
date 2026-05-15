import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return _client;
}

export interface ProspectRow {
  first_name?: string;
  company?: string;
  role?: string;
  linkedin_url?: string;
  notes?: string;
}

export async function generateOpeningLine(prospect: ProspectRow): Promise<string> {
  const message = await getClient().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    system: `You are an expert cold email copywriter. Write a single personalized opening line for a cold email. It must:
- Be 1-2 sentences max
- Reference something specific about this person or their company
- Feel human and genuine, not like a template
- NOT start with "I" or "Hi" or "Hey"
- NOT use phrases like "I came across your profile" or "I noticed"
- End with a natural transition toward a pitch

Respond with ONLY the opening line. No explanation, no quotes, no preamble.`,
    messages: [
      {
        role: "user",
        content: `Write a personalized cold email opening line for this prospect:
Name: ${prospect.first_name || "Unknown"}
Company: ${prospect.company || "Unknown"}
Role: ${prospect.role || "Unknown"}
LinkedIn: ${prospect.linkedin_url || "Not provided"}
Additional context: ${prospect.notes || "None"}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text.trim();
}
