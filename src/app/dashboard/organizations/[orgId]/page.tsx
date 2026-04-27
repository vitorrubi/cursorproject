import { notFound, redirect } from 'next/navigation';
import { OrganizationPageClient } from '@/components/OrganizationPageClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';

interface OrganizationPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { orgId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: organization, error } = await supabase
    .from('organizations')
    .select(
      `
      id,
      name,
      slug,
      owner_id,
      organization_members (
        id,
        user_id,
        role
      ),
      boards (
        id,
        title,
        created_at
      )
    `
    )
    .eq('id', orgId)
    .single();

  if (error || !organization) {
    notFound();
  }

  const hasAccess =
    organization.owner_id === user.id ||
    organization.organization_members?.some((member) => member.user_id === user.id);

  if (!hasAccess) {
    redirect('/dashboard');
  }

  return (
    <OrganizationPageClient
      organization={organization}
      orgId={orgId}
      user={{ id: user.id, email: user.email }}
    />
  );
}
