const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || ''

export async function submitQuizResponse(payload: {
  gender: string
  ageGroup: string
  education: string
  answers: number[]
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
