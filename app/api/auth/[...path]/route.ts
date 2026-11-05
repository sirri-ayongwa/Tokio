import { getAuth } from '@/lib/auth-server'

type MethodHandler = (req: Request) => Promise<Response>
type Handlers = Partial<Record<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', MethodHandler>>

let cached: Handlers | null = null
const handlers = () => (cached ??= getAuth().handler() as unknown as Handlers)

export const GET = (req: Request) => handlers().GET!(req)
export const POST = (req: Request) => handlers().POST!(req)
export const PUT = (req: Request) => handlers().PUT!(req)
export const DELETE = (req: Request) => handlers().DELETE!(req)
export const PATCH = (req: Request) => handlers().PATCH!(req)
