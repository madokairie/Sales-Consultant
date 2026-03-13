import { YoutubeTranscript } from 'youtube-transcript';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json() as { url: string };

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'URLを入力してください' }, { status: 400 });
    }

    // Extract YouTube video ID
    const videoId = extractYouTubeId(url.trim());
    if (!videoId) {
      return NextResponse.json(
        { error: 'YouTube URLを認識できませんでした。YouTube動画のURLを入力してください。' },
        { status: 400 }
      );
    }

    // Try Japanese first, then any language
    let transcriptItems;
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ja' });
    } catch {
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      } catch {
        return NextResponse.json(
          { error: 'この動画の字幕を取得できませんでした。字幕が有効な動画か確認してください。' },
          { status: 400 }
        );
      }
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      return NextResponse.json(
        { error: '字幕データが見つかりませんでした。字幕が有効な動画か確認してください。' },
        { status: 400 }
      );
    }

    // Combine transcript items into readable text
    const transcript = transcriptItems
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return NextResponse.json({
      transcript,
      charCount: transcript.length,
      source: 'youtube_subtitles',
    });
  } catch (error) {
    console.error('Transcribe API error:', error);
    const message = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json({ error: `文字起こしに失敗しました: ${message}` }, { status: 500 });
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
