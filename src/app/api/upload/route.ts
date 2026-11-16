import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Aucun fichier fourni' }, { status: 400 });
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
      return NextResponse.json(
        { success: false, error: 'Format non supporté. Utilisez JPG, PNG, WEBP, GIF, ou MP4.' },
        { status: 400 }
      );
    }

    // 2. Size limit: 50MB for video, 15MB for images
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `Fichier trop volumineux (max ${file.type.startsWith('video/') ? '50Mo' : '15Mo'})` },
        { status: 400 }
      );
    }

    // 3. Save file locally in public/uploads for instant serving
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || (file.type.startsWith('video/') ? '.mp4' : '.jpg');
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur upload';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
