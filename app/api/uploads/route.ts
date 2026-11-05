import { randomUUID } from 'crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireUser } from '@/lib/auth-server'

// Neon Object Storage is S3-compatible and requires path-style addressing.
const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})

const BUCKET = process.env.S3_BUCKET || 'uploads'
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { contentType, ext } = (await request.json()) as { contentType?: string; ext?: string }
  if (!contentType || !ALLOWED.has(contentType)) {
    return Response.json({ error: 'Only JPEG, PNG, WebP or GIF images can be uploaded.' }, { status: 400 })
  }

  const safeExt = (ext ?? 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg'
  const key = `u/${user.id}/${randomUUID()}.${safeExt}`
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 },
  )
  // The bucket is public_read, so objects serve anonymously at this URL.
  const publicUrl = `${process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, '')}/${BUCKET}/${key}`
  return Response.json({ uploadUrl, publicUrl, key })
}
