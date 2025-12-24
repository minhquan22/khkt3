import { put, list, del } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

/**
 * API để quản lý câu hỏi trên Vercel Blob Storage
 *
 * GET /api/questions - Lấy danh sách tất cả câu hỏi
 * GET /api/questions?id=<id> - Lấy một câu hỏi cụ thể
 * POST /api/questions - Tạo/lưu câu hỏi mới
 * DELETE /api/questions?id=<id> - Xóa một câu hỏi
 */
export default async function handler(request) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const url = new URL(request.url);
    const questionId = url.searchParams.get('id');

    // GET - Lấy danh sách hoặc một câu hỏi
    if (request.method === 'GET') {
      if (questionId) {
        // Lấy một câu hỏi cụ thể
        const { blobs } = await list({
          prefix: `questions/${questionId}`,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        if (blobs.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Không tìm thấy câu hỏi' }),
            { status: 404, headers }
          );
        }

        // Fetch nội dung từ blob URL
        const response = await fetch(blobs[0].url);
        const question = await response.json();

        return new Response(
          JSON.stringify({ success: true, data: question }),
          { status: 200, headers }
        );
      } else {
        // Lấy tất cả câu hỏi
        const { blobs } = await list({
          prefix: 'questions/',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        // Fetch tất cả câu hỏi
        const questions = await Promise.all(
          blobs.map(async (blob) => {
            const response = await fetch(blob.url);
            const data = await response.json();
            return {
              id: blob.pathname.replace('questions/', '').replace('.json', ''),
              uploadedAt: blob.uploadedAt,
              ...data,
            };
          })
        );

        return new Response(
          JSON.stringify({
            success: true,
            count: questions.length,
            data: questions
          }),
          { status: 200, headers }
        );
      }
    }

    // POST - Tạo/lưu câu hỏi mới
    if (request.method === 'POST') {
      const body = await request.json();

      // Validate dữ liệu
      if (!body.question || !body.options) {
        return new Response(
          JSON.stringify({
            error: 'Thiếu dữ liệu bắt buộc (question, options)'
          }),
          { status: 400, headers }
        );
      }

      // Tạo ID duy nhất nếu không có
      const id = body.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const questionData = {
        id,
        question: body.question,
        options: body.options,
        correctAnswer: body.correctAnswer || null,
        subject: body.subject || '',
        difficulty: body.difficulty || 'medium',
        tags: body.tags || [],
        createdAt: new Date().toISOString(),
      };

      // Lưu vào Vercel Blob
      const blob = await put(
        `questions/${id}.json`,
        JSON.stringify(questionData),
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: 'application/json',
        }
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Câu hỏi đã được lưu thành công',
          data: { id, url: blob.url }
        }),
        { status: 201, headers }
      );
    }

    // DELETE - Xóa câu hỏi
    if (request.method === 'DELETE') {
      if (!questionId) {
        return new Response(
          JSON.stringify({ error: 'Thiếu ID câu hỏi' }),
          { status: 400, headers }
        );
      }

      await del(`questions/${questionId}.json`, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Câu hỏi đã được xóa thành công'
        }),
        { status: 200, headers }
      );
    }

    // Method không được hỗ trợ
    return new Response(
      JSON.stringify({ error: 'Method không được hỗ trợ' }),
      { status: 405, headers }
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
