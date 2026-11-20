import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireUser, ApiError, handleApiError } from '@/lib/security/guards';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Require authentication to prevent anonymous file upload DoS
    const user = await requireUser(req);
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`upload:${user.id}:${ip}`, { maxTokens: 20, refillRate: 2 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError('BAD_REQUEST', 'Aucun fichier fourni', 400);
    }

    // 1. Validation type
    const validMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (!validMimes.includes(file.type)) {
      throw new ApiError(
        'BAD_REQUEST',
        'Format non supporté. Utilisez JPG, PNG, WEBP, GIF, ou MP4.',
        400
      );
    }

    // 2. Size limit: 50MB for video, 15MB for images
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ApiError(
        'BAD_REQUEST',
        `Fichier trop volumineux (max ${file.type.startsWith('video/') ? '50Mo' : '15Mo'})`,
        400
      );
    }

    // 3. Save file locally in public/uploads for instant serving
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || (file.type.startsWith('video/') ? '.mp4' : '.jpg');
    // Sanitize extension to avoid directory traversal
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${safeExt}`;
    const filePath = path.join(uploadsDir, safeName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
