#!/usr/bin/env node
/**
 * Quick CLI smoke test for the OpenAI API key configured in .env
 * Usage: node scripts/test-openai.js "optional custom topic"
 */

const path = require('path');
const fs = require('fs');

// Load environment variables from the nearest .env (if present)
const ENV_PATH = process.env.DOTENV_CONFIG_PATH || path.resolve(__dirname, '..', '.env');
if (fs.existsSync(ENV_PATH)) {
  require('dotenv').config({ path: ENV_PATH });
}

async function ensureFetch() {
  if (typeof fetch !== 'undefined') {
    return fetch;
  }
  const { default: nodeFetch } = await import('node-fetch');
  return nodeFetch;
}

async function run() {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('❌  No OpenAI API key found. Set EXPO_PUBLIC_OPENAI_API_KEY or OPENAI_API_KEY in your .env');
    process.exit(1);
  }

  const fetchImpl = await ensureFetch();

  const promptTopic = process.argv.slice(2).join(' ') || 'Creating a Bible study about hope during uncertainty';
  const prompt = `Create a short outline (title, scripture, summary) for a Bible study about: ${promptTopic}. Use JSON with keys title, scripture, summary.`;

  console.log('ℹ️   Testing OpenAI chat completion…');
  const startedAt = Date.now();

  try {
    const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are a Christian study assistant who responds with concise, encouraging, biblically sound guidance. Output MUST be valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌  OpenAI request failed (${response.status}): ${errorText}`);
      process.exit(1);
    }

    const payload = await response.json();
    const usage = payload.usage || {};
    const content = payload.choices?.[0]?.message?.content || '';

    console.log('✅  OpenAI responded successfully.');
    console.log(`   ↳ Latency: ${latencyMs} ms`);
    console.log(
      `   ↳ Tokens (prompt/completion/total): ${usage.prompt_tokens || 0} / ${usage.completion_tokens || 0} / ${usage.total_tokens || 0}`,
    );

    if (content) {
      console.log('--- AI Response Preview ---');
      console.log(content);
      console.log('----------------------------');
    } else {
      console.warn('⚠️   Response did not include content. Inspect payload below.');
      console.dir(payload, { depth: 4 });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌  Request threw an error:', error.message || error);
    process.exit(1);
  }
}

run();
