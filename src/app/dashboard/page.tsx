import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const [{ data: ownedOrgs }, { data: memberOrgs }] = await Promise.all([
    supabase.from('organizations').select('id').eq('owner_id', user.id).limit(1),
    supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1),
  ]);

  const firstOrganizationId = ownedOrgs?.[0]?.id || memberOrgs?.[0]?.organization_id;

  if (firstOrganizationId) {
    redirect(`/dashboard/organizations/${firstOrganizationId}`);
  }

  redirect('/dashboard/setup');
}
