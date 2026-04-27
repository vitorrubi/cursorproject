import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BoardNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Quadro não encontrado</h1>
        <p className="mt-2 text-gray-600">Verifique se o quadro ainda existe nessa organização.</p>
      </div>
      <Link href="/dashboard">
        <Button>Voltar ao painel</Button>
      </Link>
    </div>
  );
}
