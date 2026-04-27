'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  organization_members: Array<{
    id: string;
    user_id: string;
    role: string;
  }>;
  boards: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
}

interface OrganizationPageClientProps {
  organization: Organization;
  orgId: string;
  user: {
    id: string;
    email?: string;
  };
}

export function OrganizationPageClient({
  organization,
  orgId,
  user,
}: OrganizationPageClientProps) {
  const router = useRouter();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [newBoardName, setNewBoardName] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddBoardOpen, setIsAddBoardOpen] = useState(false);

  const isOwner = organization.owner_id === user.id;

  const refreshOrganization = () => {
    router.refresh();
  };

  const handleAddMember = async (e?: React.FormEvent, inviteUser = false) => {
    if (e) e.preventDefault();

    try {
      const response = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole,
          invite: inviteUser,
        }),
      });

      if (response.ok) {
        if (inviteUser) {
          alert('Convite enviado com sucesso e usuário adicionado à organização!');
        }
        setNewMemberEmail('');
        setNewMemberRole('member');
        setIsAddMemberOpen(false);
        refreshOrganization();
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (response.status === 404 && data.error === 'User not found' && !inviteUser) {
        if (window.confirm('Este usuário não possui conta no sistema. Deseja enviar um convite para o email dele criar uma conta?')) {
          await handleAddMember(undefined, true);
        }
        return;
      }

      alert(`Erro ao adicionar membro: ${data.error || 'Erro desconhecido'}`);
      console.error('Failed to add member', data);
    } catch (error) {
      alert(`Erro inesperado: ${error}`);
      console.error('Error adding member:', error);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/organizations/${orgId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newBoardName }),
      });

      if (!response.ok) {
        console.error('Failed to create board');
        return;
      }

      const board = await response.json();
      setNewBoardName('');
      setIsAddBoardOpen(false);
      refreshOrganization();
      router.push(`/dashboard/organizations/${orgId}/boards/${board.id}`);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(
        `/api/organizations/${orgId}/members?memberId=${memberId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        refreshOrganization();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600">@{organization.slug}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Membros</CardTitle>
                  <CardDescription>Gerencie os membros da sua organização</CardDescription>
                </div>
                {isOwner && (
                  <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Adicionar Membro
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Membro</DialogTitle>
                        <DialogDescription>
                          Convide um novo membro para sua organização.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddMember} className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email do Membro</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            placeholder="usuario@example.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="role">Função</Label>
                          <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Membro</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          Adicionar Membro
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {organization.organization_members?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organization.organization_members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="text-xs font-medium">
                          {member.user_id === user.id ? user.email : member.user_id}
                        </TableCell>
                        <TableCell>
                          <span className="inline-block rounded bg-gray-100 px-2 py-1 text-sm">
                            {member.role === 'owner'
                              ? 'Proprietário'
                              : member.role === 'admin'
                                ? 'Admin'
                                : 'Membro'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {isOwner && member.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-600">Nenhum membro na organização</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quadros</CardTitle>
              <CardDescription>{organization.boards?.length || 0} quadros</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {organization.boards?.map((board) => (
                  <Link
                    key={board.id}
                    href={`/dashboard/organizations/${orgId}/boards/${board.id}`}
                  >
                    <div className="rounded p-3 transition hover:bg-gray-100 cursor-pointer">
                      <p className="text-sm font-medium">{board.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(board.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </Link>
                ))}
                <Dialog open={isAddBoardOpen} onOpenChange={setIsAddBoardOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4 w-full gap-2" variant="outline">
                      <Plus className="h-4 w-4" />
                      Novo Quadro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Quadro</DialogTitle>
                      <DialogDescription>
                        Crie um novo quadro para organizar suas tarefas.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateBoard} className="space-y-4">
                      <div>
                        <Label htmlFor="board-name">Nome do Quadro</Label>
                        <Input
                          id="board-name"
                          value={newBoardName}
                          onChange={(e) => setNewBoardName(e.target.value)}
                          placeholder="Meu Quadro"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Criar Quadro
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
