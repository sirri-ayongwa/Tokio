import { getAuth } from '@/lib/auth-server'

type RouteCtx = { params: Promise<{ path: string[] }> }
type MethodHandler = (req: Request, ctx: RouteCtx) => Promise<Response>
type Handlers = Partial<Record<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', MethodHandler>>

let cached: Handlers | null = null
const handlers = () => (cached ??= getAuth().handler() as unknown as Handlers)

export const GET = (req: Request, ctx: RouteCtx) => handlers().GET!(req, ctx)
export const POST = (req: Request, ctx: RouteCtx) => handlers().POST!(req, ctx)
export const PUT = (req: Request, ctx: RouteCtx) => handlers().PUT!(req, ctx)
export const DELETE = (req: Request, ctx: RouteCtx) => handlers().DELETE!(req, ctx)
export const PATCH = (req: Request, ctx: RouteCtx) => handlers().PATCH!(req, ctx)
