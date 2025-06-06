export const callDeepSeek = async ({
  message,
  caseContext,
  attachments = [],
}: {
  message: string;
  caseContext: any;
  attachments?: string[];
}) => {
  const contextPrompt = `
You are a helpful AI assistant supporting caseworkers.

Use the following case details and attachments to answer or take action.

Case Title: ${caseContext?.title || 'N/A'}
Description: ${caseContext?.description || 'N/A'}
Priority: ${caseContext?.priority || 'N/A'}
Status: ${caseContext?.status || 'N/A'}
Category: ${caseContext?.category || 'N/A'}
Assigned To: ${caseContext?.assigned_to || 'Unassigned'}

Attachments: ${attachments.length > 0 ? attachments.join(', ') : 'None'}

User Message: "${message}"

Instructions:
- If the message is informational (e.g., "Who is assigned?", "What is the case about?"), respond directly.
- If it’s an action (e.g., "Close the case", "Assign to John Doe"), suggest the action clearly.
- Be concise and accurate.
  `;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer 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',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant trained to support caseworkers in decision-making and case actions.' },
        { role: 'user', content: contextPrompt },
      ],
    }),
  });

  const json = await response.json();

  const content = json?.choices?.[0]?.message?.content || 'Sorry, I couldn’t generate a response.';

try {
  const parsed = JSON.parse(content);
  return {
    response: parsed.response || content,
    action: parsed.action || null,
  };
} catch {
  return {
    response: content,
    action: null,
  };
}

};
