import { GoogleGenerativeAI } from '@google/generative-ai';

export const analyzeDiffWithGemini = async (diffContent, prTitle, customApiKey) => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is missing. Please set GEMINI_API_KEY in backend .env or provide it in the request.');
  }

  // Initialize the Gemini API client
  const genAI = new GoogleGenerativeAI(apiKey);
  // We use gemini-1.5-flash for speed, cost efficiency, and large context windows
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const systemInstruction = `
    You are an expert, elite senior software engineer and security auditor conducting an automated code review on a pull request/merge request.
    The PR Title is: "${prTitle}"

    Analyze the provided git diff very carefully.
    Identify potential bugs, logic issues, security vulnerabilities, performance bottlenecks, and violations of clean code style or best practices.

    You must return a JSON object conforming exactly to this structure:
    {
      "summary": "High-level summary of what the PR changes, the overall code health, and an overall verdict.",
      "score": 85, // A score between 0 and 100 representing overall code quality, cleanliness, and correctness
      "pros": [
        "Pro 1: E.g., Great unit test coverage",
        "Pro 2: E.g., Modular and clean class design"
      ],
      "cons": [
        "Con 1: E.g., Missing error handling on database connection",
        "Con 2: E.g., Hardcoded API key in config file"
      ],
      "findings": [
        {
          "file": "src/controllers/auth.js",
          "lineStart": 14,
          "lineEnd": 18,
          "category": "Security", // Choose exactly from: "Security", "Bug", "Performance", "Style"
          "severity": "Critical", // Choose exactly from: "Critical", "Warning", "Suggestion"
          "title": "Short title of the finding",
          "description": "Deep-dive analysis of why this is a concern and how it impacts the codebase.",
          "currentCode": "const token = '12345';", // Exact snippet from diff showing the issue
          "suggestedCode": "const token = process.env.API_TOKEN;" // Corrected snippet to guide the developer
        }
      ]
    }

    Guidelines:
    1. If the diff is empty or there are no changes, return a summary saying "No code changes detected" and a score of 100 with empty findings.
    2. Be critical but constructive. Only report real issues (do not nitpick unnecessarily, but don't miss critical problems).
    3. Ensure lineStart and lineEnd correspond directly to the lines where the issue resides.
    4. Category must be exactly one of: "Security", "Bug", "Performance", "Style".
    5. Severity must be exactly one of: "Critical", "Warning", "Suggestion".
    6. Double check that currentCode matches the code in the diff, and suggestedCode is valid code of the same language.
  `;

  try {
    const prompt = `Here is the git diff:
\`\`\`diff
${diffContent}
\`\`\`
`;

    const result = await model.generateContent([
      { text: systemInstruction },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    const report = JSON.parse(responseText);
    return report;
  } catch (error) {
    console.error('Gemini API analysis failed:', error);
    throw new Error(`Gemini API analysis failed: ${error.message}`);
  }
};
