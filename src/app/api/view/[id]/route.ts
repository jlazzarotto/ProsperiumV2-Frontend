import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const { id } = params
  const url = `${API_BASE_URL}/uploads/${id}/view`

  const authHeader = request.headers.get('Authorization')
  const headers: Record<string, string> = {}
  
  if (authHeader) {
    headers['Authorization'] = authHeader
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `View failed: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
      },
    })
  } catch (error: unknown) {
    console.error('[View] Error:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'View timed out' },
        { status: 408 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to view file' },
      { status: 500 }
    )
  }
}