import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

/**
 * API để lưu nhiều câu hỏi cùng lúc
 * POST /api/bulk-save - Lưu nhiều câu hỏi từ mảng
 */
export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Chỉ hỗ trợ POST method' }),
      { status: 405, headers }
    );
  }

  try {
    const body = await request.json();

    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cần cung cấp mảng questions' }),
        { status: 400, headers }
      );
    }

    const results = [];
    const errors = [];

    // Lưu từng câu hỏi
    for (let i = 0; i < body.questions.length; i++) {
      const q = body.questions[i];

      try {
        // Validate
        if (!q.question || !q.options) {
          errors.push({ index: i, error: 'Thiếu question hoặc options' });
          continue;
        }

        const id = q.id || `q_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;

        const questionData = {
          id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer || null,
          subject: q.subject || body.subject || '',
          difficulty: q.difficulty || body.difficulty || 'medium',
          tags: q.tags || body.tags || [],
          createdAt: new Date().toISOString(),
        };

        const blob = await put(
          `questions/${id}.json`,
          JSON.stringify(questionData),
          {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            contentType: 'application/json',
          }
        );

        results.push({ id, url: blob.url });

      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Đã lưu ${results.length}/${body.questions.length} câu hỏi`,
        saved: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Lỗi server',
        message: error.message
      }),
      { status: 500, headers }
    );
  }
}
