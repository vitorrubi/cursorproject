'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Column } from './Column';
import type { Column as ColumnType, Card } from '@/lib/types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { computeReorder } from '@/lib/reorder';

interface BoardProps {
  boardId: string;
  orgId: string;
}

type CardUpdateMap = Record<string, { column_id: string; position: number }>;

export function Board({ boardId, orgId }: BoardProps) {
  const queryClient = useQueryClient();

  // Fetch columns and cards
  const { data: columns = [], isLoading } = useQuery({
    queryKey: ['columns', orgId, boardId],
    queryFn: async () => {
      const { data } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });
      return data || [];
    },
    enabled: !!boardId,
  });

  const { data: cards = [] } = useQuery({
    queryKey: ['cards', orgId, boardId],
    queryFn: async () => {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });
      return data || [];
    },
    enabled: !!boardId,
  });

  // Build container -> item mapping for dnd-kit
  const sensors = useSensors(useSensor(PointerSensor));

  const applyCardUpdates = (currentCards: Card[], updates: CardUpdateMap) => {
    return currentCards.map((card) => {
      const update = updates[card.id];

      if (!update) {
        return card;
      }

      return {
        ...card,
        column_id: update.column_id,
        position: update.position,
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // derive active card id and destination column id
    const activeCardId = activeId.replace('card-', '');

    let destColumnId: string | null = null;
    if (overId.startsWith('card-')) {
      const overCardId = overId.replace('card-', '');
      const overCard = (cards as Card[]).find((c) => c.id === overCardId);
      destColumnId = overCard ? overCard.column_id : null;
    } else if (overId.startsWith('column-')) {
      destColumnId = overId.replace('column-', '');
    }

    if (!destColumnId) return;

    const activeCard = (cards as Card[]).find((c) => c.id === activeCardId);
    if (!activeCard) return;

    const srcColumnId = activeCard.column_id;
    // compute necessary updates for positions and columns
    console.log('[dnd] dragEnd active:', activeId, 'over:', overId);
    const updates = computeReorder(cards as Card[], activeCardId, overId);
    if (!updates || Object.keys(updates).length === 0) return;

    // optimistic update: apply set of updates locally
    queryClient.setQueryData<Card[]>(['cards', orgId, boardId], (old) => {
      if (!old) return old;

      return applyCardUpdates(old, updates);
    });

    // persist all updates
    try {
      const promises = Object.entries(updates).map(([cardId, change]) =>
        supabase
          .from('cards')
          .update({ column_id: change.column_id, position: change.position })
          .eq('id', cardId)
      );
      await Promise.all(promises);

      // add history entry for moved card if column changed, otherwise 'reordered'
      const movedTo = updates[activeCardId]?.column_id;
      const action = movedTo && movedTo !== srcColumnId ? 'moved' : 'reordered';
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('card_history').insert([
          {
            card_id: activeCardId,
            user_id: user.id,
            user_email: user.email || '',
            action,
            from_column_id: srcColumnId,
            to_column_id: updates[activeCardId]?.column_id || srcColumnId,
          },
        ]);
      }
    } catch {
      queryClient.invalidateQueries({ queryKey: ['cards', orgId, boardId] });
    } finally {
      queryClient.invalidateQueries({ queryKey: ['cards', orgId, boardId] });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeCardId = activeId.replace('card-', '');

    // compute tentative updates and apply locally for visual feedback
    console.log('[dnd] dragOver active:', activeId, 'over:', overId);
    const updates = computeReorder(cards as Card[], activeCardId, overId);
    if (!updates || Object.keys(updates).length === 0) return;

    queryClient.setQueryData<Card[]>(['cards', orgId, boardId], (old) => {
      if (!old) return old;

      return applyCardUpdates(old, updates);
    });
  };

  if (isLoading) {
    return <div>Carregando quadro...</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(columns as ColumnType[]).map((column) => (
          <Column
            key={column.id}
            column={column}
            cards={(cards as Card[]).filter((c) => c.column_id === column.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
