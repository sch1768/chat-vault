import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/storage';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { title } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: '수정할 제목이 필요합니다.' }, { status: 400 });
    }

    if (supabase) {
      const { error } = await supabase.from('conversations').update({ title }).eq('id', id);
      if (error) {
        console.error('Failed to update title in Supabase:', error);
      }
    }

    return NextResponse.json({
      success: true,
      title,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '제목 수정 실패';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
