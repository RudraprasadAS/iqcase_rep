export const callOpenRouter = async ({
  message,
  caseContext,
}: {
  message: string;
  caseContext?: any;
}): Promise<{ response: string }> => {
  const prompt = `
You are a helpful assistant supporting caseworkers. The current case context is:
Title: ${caseContext?.title || 'N/A'}
Status: ${caseContext?.status || 'N/A'}
Priority: ${caseContext?.priority || 'N/A'}
Category: ${caseContext?.category || 'N/A'}
Assigned To: ${caseContext?.assigned_to || 'N/A'}
Description: ${caseContext?.description || 'N/A'}

User instruction: ${message}
Respond clearly and perform any needed structured action if possible.
  `.trim();

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer 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',
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://your-site.com', // optional
      'X-Title': 'AI Case Assistant', // optional
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: 'You are an AI assistant for case management tasks.' },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('❌ OpenRouter Error:', error);
    throw new Error('OpenRouter API call failed');
  }

  const json = await res.json();
  return {
    response: json.choices?.[0]?.message?.content || 'No response from model.'
  };
};
