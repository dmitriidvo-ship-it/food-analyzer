import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(request) {
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
1. Найди в тексте раздел "Состав" или "Ingredients" — это список ингредиентов
2. Оцени продукт по шкале от 1 до 10, где:
   - 1-2: очень вредный (много Е-шек, трансжиры, сахар на первом месте)
   - 3-4: плохой (много добавок, консервантов)
   - 5-6: средний (есть добавки, но умеренно)
   - 7-8: хороший (минимум добавок, натуральный состав)
   - 9-10: отличный (полностью натуральный)
3. Выдели до 4 самых важных ингредиентов

Если состав не найден в тексте — напиши об этом в verdict.

Ответь СТРОГО в формате JSON без каких-либо других слов:
{
  "score": число от 1 до 10,
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
      model: 'openrouter/owl-alpha',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Модель не вернула JSON');
    const parsed = JSON.parse(jsonMatch[0]);

    return Response.json(parsed);
  } catch (err) {
    console.error('OpenRouter error:', err);
    return Response.json(
      { error: 'Не удалось проанализировать состав. Попробуй ещё раз.' },
      { status: 500 }
    );
  }
}
