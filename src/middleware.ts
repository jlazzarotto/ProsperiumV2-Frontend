import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que NÃO precisam de autenticação
const publicRoutes = ['/', '/login', '/definir-senha']

// Rotas que precisam de autenticação
const protectedRoutes = [
  '/cadastros',
  '/financeiro',
  '/relatorios',
  '/configuracoes',
  '/admin',
  '/contabeis',
  '/movimento',
  '/asaas',
  '/contabilidade',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.includes(pathname)

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Se for rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Se for rota protegida, verificar autenticação
  if (isProtectedRoute) {
    // Verificar se tem token no cookie
    const token = request.cookies.get('auth_token')?.value

    // Se não tiver token, redirecionar para login
    if (!token) {
      const loginUrl = new URL('/', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// Configurar em quais rotas o middleware deve rodar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
