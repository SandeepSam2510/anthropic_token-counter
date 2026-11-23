// Predefined text samples shown in the app.
export const SAMPLES = [
  { id: 'word', label: 'Single word', text: 'Hello' },
  { id: 'greeting', label: 'Short sentence', text: 'Hello, world! How are you today?' },
  {
    id: 'pangram',
    label: 'Pangram',
    text: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    id: 'question',
    label: 'Question',
    text: 'What is the difference between a token and a word in large language models?',
  },
  {
    id: 'paragraph',
    label: 'Paragraph',
    text:
      'Tokens are the basic units that language models read and write. A token can be a whole word, ' +
      'part of a word, a number, or a punctuation mark. Counting tokens before sending a request helps ' +
      'you estimate cost and stay within the model’s context window.',
  },
  {
    id: 'code',
    label: 'Code snippet',
    text: 'function add(a, b) {\n  return a + b;\n}\nconsole.log(add(2, 3));',
  },
  {
    id: 'numbers',
    label: 'Numbers & symbols',
    text: 'Order #48213 — 3 items @ $19.99 each = $59.97 (incl. 18% GST).',
  },
  {
    id: 'multilingual',
    label: 'Multilingual',
    text: 'Namaste! नमस्ते ¡Hola! Bonjour! こんにちは',
  },
  { id: 'emoji', label: 'Emoji', text: 'Great job! 🎉🚀🔥👍' },
];

// Model IDs offered in the dropdown. All active Claude models support token counting.
export const MODELS = [
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  { id: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
];
