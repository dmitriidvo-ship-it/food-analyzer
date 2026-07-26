import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '60 s'), 
  analytics: true, 
});

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

function getAlternatives(category) {
  try {
    const filePath = join(process.cwd(), 'data', 'alternatives.json');
    const db = JSON.parse(readFileSync(filePath, 'utf-8'));
    const key = category?.toLowerCase();
    return db[key] || null;
  } catch {
    return null;
  }
}


export async function POST(request) {

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1';
  

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);
  
  if (!success) {
    return Response.json(
      { error: `Слишком много запросов. Попробуй через ${Math.ceil((reset - Date.now()) / 1000)} секунд.` },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit,
          'X-RateLimit-Remaining': remaining,
          'X-RateLimit-Reset': reset,
        }
      }
    );
  }
  try {
    const { text } = await request.json();

    if (!text) {
      return Response.json({ error: 'Текст не получен' }, { status: 400 });
    }

    const prompt = `Ты эксперт по питанию и здоровому образу жизни.

Вот текст, распознанный с этикетки продукта питания:
"""
${text}
"""

Твоя задача:
1. Найди в тексте раздел "Состав" или "Ingredients"
2. Определи категорию продукта — выбери ОДНУ из: сладости, напитки, соусы, полуфабрикаты, снеки. Если не подходит ни одна — напиши null
3. Оцени продукт по шкале от 1 до 10, где:
   - 1-2: очень вредный (много Е-шек, трансжиры, сахар на первом месте)
   - 3-4: плохой (много добавок, консервантов)
   - 5-6: средний (есть добавки, но умеренно)
   - 7-8: хороший (минимум добавок, натуральный состав)
   - 9-10: отличный (полностью натуральный)
4. Выдели до 4 самых важных ингредиентов

Ответь СТРОГО в формате JSON без каких-либо других слов:
{
  "score": число от 1 до 10,
  "category": "сладости" | "напитки" | "соусы" | "полуфабрикаты" | "снеки" | null,
  "verdict": "краткий вывод 1-2 предложения на русском",
  "composition": "найденный состав продукта",
  "ingredients": [
    {
      "name": "название ингредиента",
      "reason": "почему это важно, 1 предложение",
      "type": "bad | ok | good"
    }
  ]
}`;

    const response = await client.chat.completions.create({
      model: 'inclusionai/ling-3.0-flash:free',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Модель не вернула JSON');
    const parsed = JSON.parse(jsonMatch[0]);

  
    if (parsed.category && parsed.score < 7) {
      const altData = getAlternatives(parsed.category);
      if (altData) {
        parsed.alternatives = altData;
      }
    }

    return Response.json(parsed);
  } catch (err) {
    console.error('OpenRouter error:', err);
    return Response.json(
      { error: 'Не удалось проанализировать состав. Попробуй ещё раз.' },
      { status: 500 }
    );
  }
}
