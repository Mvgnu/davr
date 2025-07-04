import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from 'crypto'; // For generating unique filenames

// --- Configuration --- 
const hetznerEndpoint = process.env.HETZNER_S3_ENDPOINT;
const hetznerRegion = process.env.HETZNER_S3_REGION;
const hetznerBucketName = process.env.HETZNER_S3_BUCKET_NAME;
const hetznerAccessKeyId = process.env.HETZNER_S3_ACCESS_KEY_ID;
const hetznerSecretAccessKey = process.env.HETZNER_S3_SECRET_ACCESS_KEY;
const hetznerPublicUrlBase = process.env.HETZNER_S3_PUBLIC_URL;

// --- Basic Validation --- 
if (!hetznerEndpoint || !hetznerRegion || !hetznerBucketName || !hetznerAccessKeyId || !hetznerSecretAccessKey) {
    console.error("Hetzner S3 environment variables are not fully configured.");
}

// --- S3 Client Initialization ---
const s3Client = new S3Client({
    endpoint: hetznerEndpoint,
    region: hetznerRegion,
    credentials: {
        accessKeyId: hetznerAccessKeyId!,
        secretAccessKey: hetznerSecretAccessKey!,
    },
    forcePathStyle: false,
});

// Helper to generate a unique filename
const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

// Allowed file types and max size
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// --- POST Handler: Generate Presigned URL for Upload --- 
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hetznerEndpoint || !hetznerBucketName) {
         return NextResponse.json({ error: 'Storage service not configured.' }, { status: 500 });
    }

    try {
        const { filename, contentType } = await request.json();

        if (!ALLOWED_FILE_TYPES.includes(contentType)) {
            return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
        }

        const uniqueKey = `${generateFileName()}-${filename}`;

        const command = new PutObjectCommand({
            Bucket: hetznerBucketName,
            Key: uniqueKey,
            ContentType: contentType,
            // ACL: 'public-read', // Uncomment if your bucket needs public-read ACL for direct access
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });

        const finalImageUrl = hetznerPublicUrlBase
            ? `${hetznerPublicUrlBase.replace(/\/$/, '')}/${uniqueKey}`
            : `${hetznerEndpoint.replace(/\/\/([^\/]+)/, `//${hetznerBucketName}.$1`)}/${uniqueKey}`;

        return NextResponse.json({ 
            presignedUrl,
            imageUrl: finalImageUrl
         });

    } catch (error) {
        console.error('[POST Upload Request Error]', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
}
 