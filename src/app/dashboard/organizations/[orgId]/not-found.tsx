import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OrganizationNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Organização não encontrada</h1>
        <p className="mt-2 text-gray-600">Ela pode ter sido removida ou você não possui acesso.</p>
      </div>
      <Link href="/dashboard">
        <Button>Voltar ao painel</Button>
      </Link>
    </div>
  );
}
