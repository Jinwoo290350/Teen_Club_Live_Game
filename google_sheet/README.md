# Google Apps Script — Teen Club Live

script รับ POST จาก Next.js แล้วบันทึกลง Google Sheets 2 sheet:
- **responses** — ข้อมูลผู้เล่น + คำตอบ 26 ข้อ + คะแนน
- **satisfaction** — แบบประเมินความพึงพอใจ 14 ข้อ + ข้อเสนอแนะ

---

## วิธีติดตั้ง (ทำครั้งเดียว)

### 1. สร้าง Google Sheet

1. ไปที่ [sheets.google.com](https://sheets.google.com) → สร้าง Spreadsheet ใหม่
2. ตั้งชื่อตามต้องการ เช่น `Teen Club Live — Responses`

### 2. เปิด Apps Script

1. ใน Google Sheet → เมนู **Extensions → Apps Script**
2. ลบโค้ดเดิมทิ้งทั้งหมด
3. วางโค้ดจากไฟล์ `Code.gs` ลงไปทั้งหมด
4. กด **Save** (Ctrl+S)

### 3. Deploy เป็น Web App

1. กด **Deploy → New deployment**
2. ตั้งค่าดังนี้:
   - **Type:** Web app
   - **Execute as:** Me
   - **Who has access:** Anyone
3. กด **Deploy**
4. **คัดลอก URL** ที่ได้ (จะมีหน้าตาประมาณ `https://script.google.com/macros/s/XXXX/exec`)

### 4. ใส่ URL ใน .env.local

เปิดไฟล์ `.env.local` ที่ root ของ project แล้วใส่:

```env
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
```

> ⚠️ ทุกครั้งที่แก้โค้ด `Code.gs` ต้อง **Deploy ใหม่** (New deployment) แล้วอัปเดต URL ใหม่ด้วย

---

## โครงสร้างข้อมูล

### Sheet: responses

| คอลัมน์ | ข้อมูล |
|---------|--------|
| A | timestamp |
| B | gender |
| C | ageGroup |
| D | education |
| E–AD | s2q1 … s16q2 (26 คอลัมน์, index ที่เลือก 0-based) |
| AE | score (จำนวนข้อที่ตอบถูก) |
| AF | totalQuestions (26) |

### Sheet: satisfaction

| คอลัมน์ | ข้อมูล |
|---------|--------|
| A | timestamp |
| B–O | sat1 … sat14 (ค่า 1–5) |
| P | additionalComments |

---

## ทดสอบ

เปิด URL ใน browser ตรงๆ ควรเห็น:
```json
{"status":"ok","message":"Teen Club Live API is running"}
```
