export interface EntireTask {
  task_id: string
  review_url: string
}

interface CreateApprovalParams {
  title: string
  content: string
  targetUrl: string
  brandName: string
  draftId: string
}

export async function createApprovalTask(params: CreateApprovalParams): Promise<EntireTask> {
  const apiKey = process.env.ENTIRE_API_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!apiKey) {
    console.warn('⚠️  ENTIRE_API_KEY not set — using mock approval task')
    return { task_id: `mock-${Date.now()}`, review_url: '#' }
  }

  try {
    const res = await fetch('https://api.entire.io/v1/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        title: `Review content for ${params.brandName}`,
        description: params.content,
        metadata: {
          draftId: params.draftId,
          targetUrl: params.targetUrl,
          brandName: params.brandName,
        },
        callback_url: `${appUrl}/api/entire/webhook`,
      }),
    })
    if (!res.ok) throw new Error(`Entire API returned ${res.status}`)
    const data = await res.json()
    return { task_id: data.task_id, review_url: data.review_url ?? '#' }
  } catch (err) {
    console.warn('⚠️  Entire API error — using mock approval task:', err)
    return { task_id: `mock-${Date.now()}`, review_url: '#' }
  }
}
