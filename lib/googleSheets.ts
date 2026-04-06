const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || ''

export async function submitQuizResponse(payload: {
  gender: string
  ageGroup: string
  education: string
  answers: number[]        // 26 ค่า: 1 = ถูก, 0 = ผิด
  sectionResults: number[] // 15 ค่า: 1 = ถูกทุกข้อในส่วน, 0 = มีผิด (ส่วน 2–16)
  categoryResults: number[] // 3 ค่า: 1 = ถูกทุกข้อในหมวด, 0 = มีผิด (หมวด 1–3)
  score: number
  totalQuestions: number
}) {
  if (!SCRIPT_URL) return
  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ type: 'quiz', ...payload }),
  }).catch(() => {})
}

export async function submitSatisfactionResponse(payload: {
  ratings: number[]
  comments: string
}) {
  if (!SCRIPT_URL) return
  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ type: 'satisfaction', ...payload }),
  }).catch(() => {})
}
