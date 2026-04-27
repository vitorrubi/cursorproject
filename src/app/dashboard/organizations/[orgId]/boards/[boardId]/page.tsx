import { notFound, redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Board } from '@/components/Board';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';

interface BoardPageProps {
  params: Promise<{ orgId: string; boardId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { orgId, boardId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const [{ data: membership }, { data: board }] = await Promise.all([
    supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('boards')
      .select('id')
      .eq('id', boardId)
      .eq('organization_id', orgId)
      .maybeSingle(),
  ]);

  if (!membership) {
    redirect('/dashboard');
  }

  if (!board) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <Link href={`/dashboard/organizations/${orgId}`}>
          <Button variant="outline" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </Link>
        <Board boardId={boardId} orgId={orgId} />
      </div>
    </main>
  );
}
