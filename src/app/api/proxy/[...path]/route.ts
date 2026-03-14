import { NextRequest, NextResponse } from 'next/server'

// API_BACKEND_URL é server-only (sem NEXT_PUBLIC_), nunca exposta ao browser.
// Em dev: definir em .env.local. Em prod: configurar no servidor/docker/CI.
const API_BASE_URL = process.env.API_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

/**
 * Extrai o tenant (subdomínio) do hostname da requisição.
 * upper2.prosperium.net.br → upper2
 * work2.prosperium.net.br → work2
 */
function getTenantFromHost(request: NextRequest): string | null {
  const host = request.headers.get('host') || request.headers.get('x-forwarded-host') || ''
  const hostname = host.replace(/:\d+$/, '') // remove porta

  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null
  }

  const parts = hostname.split('.')
  if (parts.length >= 3) {
    return parts[0] // upper2 ou work2
  }

  return null
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  const path = params.path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${API_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ''}`
  
  console.log(`[Proxy GET] Original URL: ${request.nextUrl.href}`)
  console.log(`[Proxy GET] Search params: ${searchParams}`)
  console.log(`[Proxy GET] Final URL: ${url}`)

  // Pegar o Authorization header da requisição original
  const authHeader = request.headers.get('Authorization')
  const tenant = getTenantFromHost(request)
  const headers: Record<string, string> = {}

  if (authHeader) {
    headers['Authorization'] = authHeader
  }
  if (tenant) {
    headers['X-Tenant'] = tenant
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    const contentType = response.headers.get('content-type')
    
    // Se for um arquivo (não JSON), retornar como stream
    if (contentType && !contentType.includes('application/json')) {
      const buffer = await response.arrayBuffer()
      
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': response.headers.get('Content-Disposition') || '',
        },
      })
    }

    // Para JSON, fazer parse normal
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 408 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch from API' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  const path = params.path.join('/')
  const url = `${API_BASE_URL}/${path}`

  console.log(`[Proxy POST] URL: ${url}`)

  // Pegar o Authorization header da requisição original
  const authHeader = request.headers.get('Authorization')
  const contentType = request.headers.get('Content-Type')
  const tenant = getTenantFromHost(request)

  let body: string | FormData
  const headers: Record<string, string> = {}

  // Adicionar Authorization se existir
  if (authHeader) {
    headers['Authorization'] = authHeader
  }
  if (tenant) {
    headers['X-Tenant'] = tenant
  }

  // Verificar se é multipart/form-data (upload de arquivo)
  if (contentType?.includes('multipart/form-data')) {
    // Para multipart, usar FormData diretamente e NÃO definir Content-Type
    // (o fetch define automaticamente com boundary correto)
    body = await request.formData()
  } else {
    // Para JSON normal
    try {
      const jsonBody = await request.json()
      body = JSON.stringify(jsonBody)
      headers['Content-Type'] = 'application/json'
    } catch (error) {
      console.error('[Proxy] Erro ao fazer parse do JSON:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    // Verificar se a resposta tem conteúdo antes de tentar fazer parse
    const contentType = response.headers.get('content-type')
    const hasContent = response.headers.get('content-length') !== '0'

    if (!response.ok) {
      // Se não for sucesso (2xx), tentar extrair mensagem de erro
      let errorData: Record<string, unknown> = { error: 'Failed to post to API' }
      if (contentType?.includes('application/json') && hasContent) {
        try {
          errorData = await response.json()
        } catch {
          // Ignorar erro de parse
        }
      }
      return NextResponse.json(errorData, { status: response.status })
    }

    // Resposta de sucesso (200, 201, etc)
    if (contentType?.includes('application/json') && hasContent) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    // Resposta sem conteúdo (204 ou similar)
    return new NextResponse(null, { status: response.status })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 408 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to post to API' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  const path = params.path.join('/')
  const url = `${API_BASE_URL}/${path}`

  // Pegar o Authorization header da requisição original
  const authHeader = request.headers.get('Authorization')
  const tenant = getTenantFromHost(request)
  const contentType = request.headers.get('Content-Type')
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['Authorization'] = authHeader
  }
  if (tenant) {
    headers['X-Tenant'] = tenant
  }

  // Tentar fazer parse do body, mas aceitar se estiver vazio
  let body = null
  if (contentType?.includes('multipart/form-data')) {
    body = await request.formData()
  } else {
    headers['Content-Type'] = 'application/json'
    try {
      const text = await request.text()
      if (text && text.trim()) {
        body = JSON.parse(text)
      }
    } catch (error) {
      // Ignorar erro se não conseguir fazer parse (body vazio está OK)
      console.log('[Proxy PUT] No body or invalid JSON, sending without body')
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout
    
    const fetchOptions: RequestInit = {
      method: 'PUT',
      headers,
      signal: controller.signal,
    }

    // Só adicionar body se existir
    if (body !== null) {
      fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body)
    }
    
    const response = await fetch(url, fetchOptions)
    
    clearTimeout(timeoutId)

    // Verificar se a resposta tem conteúdo antes de tentar fazer parse
    const contentType = response.headers.get('content-type')
    const hasContent = response.headers.get('content-length') !== '0'

    if (!response.ok) {
      // Se não for sucesso (2xx), tentar extrair mensagem de erro
      let errorData: Record<string, unknown> = { error: 'Failed to update in API' }
      if (contentType?.includes('application/json') && hasContent) {
        try {
          errorData = await response.json()
        } catch {
          // Ignorar erro de parse
        }
      }
      return NextResponse.json(errorData, { status: response.status })
    }

    // Resposta de sucesso (200, 201, etc)
    if (contentType?.includes('application/json') && hasContent) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    // Resposta sem conteúdo (204 ou similar)
    return new NextResponse(null, { status: response.status })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 408 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update in API' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  const path = params.path.join('/')
  const url = `${API_BASE_URL}/${path}`

  const authHeader = request.headers.get('Authorization')
  const tenant = getTenantFromHost(request)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authHeader) {
    headers['Authorization'] = authHeader
  }
  if (tenant) {
    headers['X-Tenant'] = tenant
  }

  let body = null
  try {
    const text = await request.text()
    if (text && text.trim()) {
      body = JSON.parse(text)
    }
  } catch {
    // body vazio está OK
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const fetchOptions: RequestInit = {
      method: 'PATCH',
      headers,
      signal: controller.signal,
    }

    if (body !== null) {
      fetchOptions.body = JSON.stringify(body)
    }

    const response = await fetch(url, fetchOptions)
    clearTimeout(timeoutId)

    const contentType = response.headers.get('content-type')
    const hasContent = response.headers.get('content-length') !== '0'

    if (!response.ok) {
      let errorData: Record<string, unknown> = { error: 'Failed to patch in API' }
      if (contentType?.includes('application/json') && hasContent) {
        try {
          errorData = await response.json()
        } catch {
          // Ignorar erro de parse
        }
      }
      return NextResponse.json(errorData, { status: response.status })
    }

    if (contentType?.includes('application/json') && hasContent) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    return new NextResponse(null, { status: response.status })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 408 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to patch in API' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params
  const path = params.path.join('/')
  const url = `${API_BASE_URL}/${path}`

  // Pegar o Authorization header da requisição original
  const authHeader = request.headers.get('Authorization')
  const tenant = getTenantFromHost(request)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (authHeader) {
    headers['Authorization'] = authHeader
  }
  if (tenant) {
    headers['X-Tenant'] = tenant
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    // DELETE pode retornar sem body
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return new NextResponse(null, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Proxy] Error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 408 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete from API' },
      { status: 500 }
    )
  }
}
