# EduMatrix Question Storage API

API Node.js để lưu trữ câu hỏi trên Vercel Blob Storage.

## Tính năng

- ✅ Lưu câu hỏi lên Vercel Blob Storage
- ✅ Lấy danh sách tất cả câu hỏi
- ✅ Lấy chi tiết một câu hỏi
- ✅ Xóa câu hỏi
- ✅ Lưu nhiều câu hỏi cùng lúc (bulk save)
- ✅ CORS enabled - Gọi từ frontend dễ dàng

## Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình Vercel Blob Storage

#### Bước 1: Tạo Blob Store trên Vercel

1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard)
2. Vào **Storage** → **Create Database** → Chọn **Blob**
3. Đặt tên cho store (ví dụ: `edumatrix-questions`)
4. Tạo store

#### Bước 2: Lấy token

1. Sau khi tạo store, vào tab **Settings** của store
2. Copy **Read-Write Token**
3. Tạo file `.env` trong project:

```bash
cp .env.example .env
```

4. Dán token vào file `.env`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxx
```

### 3. Deploy lên Vercel

#### Cách 1: Deploy qua Vercel CLI (Khuyến nghị)

```bash
# Cài đặt Vercel CLI
npm install -g vercel

# Login vào Vercel
vercel login

# Deploy
vercel

# Deploy production
vercel --prod
```

#### Cách 2: Deploy qua GitHub

1. Push code lên GitHub repository
2. Truy cập [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Add New** → **Project**
4. Import repository từ GitHub
5. Thêm Environment Variable:
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: Token của bạn
6. Click **Deploy**

### 4. Test local

```bash
# Chạy development server
npm run dev

# API sẽ chạy tại http://localhost:3000
```

## API Endpoints

### 1. Lưu một câu hỏi

**POST** `/api/questions`

**Body:**
```json
{
  "question": "Thủ đô của Việt Nam là gì?",
  "options": ["Hà Nội", "TP.HCM", "Đà Nẵng", "Cần Thơ"],
  "correctAnswer": 0,
  "subject": "Địa lý",
  "difficulty": "easy",
  "tags": ["việt nam", "địa lý"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Câu hỏi đã được lưu thành công",
  "data": {
    "id": "q_1234567890_abc",
    "url": "https://blob.vercel-storage.com/..."
  }
}
```

### 2. Lấy tất cả câu hỏi

**GET** `/api/questions`

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "q_1234567890_abc",
      "question": "Thủ đô của Việt Nam là gì?",
      "options": ["Hà Nội", "TP.HCM", "Đà Nẵng", "Cần Thơ"],
      "correctAnswer": 0,
      "subject": "Địa lý",
      "difficulty": "easy",
      "tags": ["việt nam", "địa lý"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "uploadedAt": "2024-01-15T10:30:05.000Z"
    }
  ]
}
```

### 3. Lấy một câu hỏi cụ thể

**GET** `/api/questions?id=q_1234567890_abc`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "q_1234567890_abc",
    "question": "Thủ đô của Việt Nam là gì?",
    "options": ["Hà Nội", "TP.HCM", "Đà Nẵng", "Cần Thơ"],
    "correctAnswer": 0,
    "subject": "Địa lý",
    "difficulty": "easy",
    "tags": ["việt nam", "địa lý"],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Xóa câu hỏi

**DELETE** `/api/questions?id=q_1234567890_abc`

**Response:**
```json
{
  "success": true,
  "message": "Câu hỏi đã được xóa thành công"
}
```

### 5. Lưu nhiều câu hỏi cùng lúc

**POST** `/api/bulk-save`

**Body:**
```json
{
  "subject": "Toán học",
  "difficulty": "medium",
  "questions": [
    {
      "question": "2 + 2 = ?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": 1
    },
    {
      "question": "3 x 3 = ?",
      "options": ["6", "9", "12", "15"],
      "correctAnswer": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã lưu 2/2 câu hỏi",
  "saved": 2,
  "failed": 0,
  "results": [
    { "id": "q_1234567890_abc", "url": "..." },
    { "id": "q_1234567891_def", "url": "..." }
  ]
}
```

## Tích hợp với Frontend

### Ví dụ JavaScript/Fetch

```javascript
// Lưu câu hỏi
async function saveQuestion(questionData) {
  const response = await fetch('https://your-domain.vercel.app/api/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(questionData)
  });
  return await response.json();
}

// Lấy tất cả câu hỏi
async function getAllQuestions() {
  const response = await fetch('https://your-domain.vercel.app/api/questions');
  return await response.json();
}

// Xóa câu hỏi
async function deleteQuestion(id) {
  const response = await fetch(`https://your-domain.vercel.app/api/questions?id=${id}`, {
    method: 'DELETE'
  });
  return await response.json();
}
```

### Ví dụ tích hợp với EduMatrix HTML

Thêm vào file `index.html` của bạn:

```javascript
// Sau khi AI tạo câu hỏi, lưu lên Vercel
async function saveQuestionToCloud(questionData) {
  try {
    const response = await fetch('https://your-domain.vercel.app/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionData)
    });
    const result = await response.json();

    if (result.success) {
      console.log('Đã lưu câu hỏi:', result.data.id);
      alert('Câu hỏi đã được lưu thành công!');
    }
  } catch (error) {
    console.error('Lỗi khi lưu:', error);
    alert('Không thể lưu câu hỏi. Vui lòng thử lại.');
  }
}

// Gọi hàm sau khi AI tạo câu hỏi
// saveQuestionToCloud({ question: "...", options: [...], ... });
```

## Cấu trúc dữ liệu câu hỏi

```typescript
{
  id: string;              // Auto-generated nếu không cung cấp
  question: string;        // Nội dung câu hỏi (bắt buộc)
  options: string[];       // Các đáp án (bắt buộc)
  correctAnswer: number;   // Index của đáp án đúng (0-based)
  subject: string;         // Môn học
  difficulty: string;      // "easy" | "medium" | "hard"
  tags: string[];          // Tags để phân loại
  createdAt: string;       // ISO timestamp
}
```

## Chi phí

Vercel Blob Storage có gói miễn phí:
- 500MB storage
- 5GB bandwidth/tháng

Xem thêm: https://vercel.com/docs/storage/vercel-blob/usage-and-pricing

## Lỗi thường gặp

### 1. "Missing BLOB_READ_WRITE_TOKEN"
- Kiểm tra đã thêm environment variable trên Vercel chưa
- Với local dev: Kiểm tra file `.env`

### 2. CORS error
- API đã cấu hình CORS cho tất cả domains (`*`)
- Nếu vẫn lỗi, kiểm tra request headers

### 3. "Rate limit exceeded"
- Vercel có giới hạn requests. Nâng cấp plan nếu cần.

## License

MIT
