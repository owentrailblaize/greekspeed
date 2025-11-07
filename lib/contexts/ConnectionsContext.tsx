'use client';

import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
  addConnection,
  cancelConnectionRequest as cancelConnectionRequestThunk,
  clearConnections as clearConnectionsAction,
  fetchConnections,
  removeConnection,
  selectAllConnections,
  selectConnectionEntities,
  selectConnectionsState,
  sendConnectionRequest as sendConnectionRequestThunk,
  type Connection,
  updateConnection,
  updateConnectionStatus as updateConnectionStatusThunk,
} from '@/lib/store/slices/connectionsSlice';
export type { Connection } from '@/lib/store/slices/connectionsSlice';
interface ConnectionsContextType {
  connections: Connection[];
  loading: boolean;
  error: string | null;
  sendConnectionRequest: (recipientId: string, message?: string) => Promise<Connection>;
  updateConnectionStatus: (
    connectionId: string,
    status: 'accepted' | 'declined' | 'blocked',
  ) => Promise<Connection>;
  cancelConnectionRequest: (connectionId: string) => Promise<void>;
  getConnectionStatus: (otherUserId: string) => 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined' | 'blocked';
  getConnectionId: (otherUserId: string) => string | null;
  refreshConnections: () => Promise<void>;
}

export function ConnectionsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useConnections(): ConnectionsContextType {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(selectConnectionsState);
  const connections = useAppSelector(selectAllConnections);
  const connectionEntities = useAppSelector(selectConnectionEntities);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const requesterProfile = useAppSelector((state) => state.profile.profile);

  const sendConnectionRequest = useCallback(
    async (recipientId: string, message?: string) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const optimisticId = `optimistic-${Date.now()}`;
      const timestamp = new Date().toISOString();
      const optimisticConnection: Connection = {
        id: optimisticId,
        requester_id: userId,
        recipient_id: recipientId,
        status: 'pending',
        message,
        created_at: timestamp,
        updated_at: timestamp,
        requester: {
          id: userId,
          full_name: requesterProfile?.full_name ?? '',
          first_name: requesterProfile?.first_name ?? null,
          last_name: requesterProfile?.last_name ?? null,
          chapter: requesterProfile?.chapter ?? null,
          avatar_url: requesterProfile?.avatar_url ?? null,
        },
        recipient: {
          id: recipientId,
          full_name: '',
          first_name: null,
          last_name: null,
          chapter: null,
          avatar_url: null,
        },
      };

      dispatch(addConnection(optimisticConnection));

      const action = await dispatch(sendConnectionRequestThunk({ recipientId, message }));

      dispatch(removeConnection(optimisticId));

      if (sendConnectionRequestThunk.fulfilled.match(action)) {
        return action.payload;
      }

      const messageText =
        typeof action.payload === 'string'
          ? action.payload
          : action.error?.message ?? 'Failed to send connection request';
      throw new Error(messageText);
    },
    [dispatch, requesterProfile, userId],
  );

  const updateConnectionStatus = useCallback(
    async (connectionId: string, status: 'accepted' | 'declined' | 'blocked') => {
      const existing = connectionEntities[connectionId];
      const previousStatus = existing?.status;

      if (existing) {
        dispatch(updateConnection({ id: connectionId, changes: { status } }));
      }

      const action = await dispatch(updateConnectionStatusThunk({ connectionId, status }));

      if (updateConnectionStatusThunk.fulfilled.match(action)) {
        return action.payload;
      }

      if (previousStatus) {
        dispatch(updateConnection({ id: connectionId, changes: { status: previousStatus } }));
      }

      const messageText =
        typeof action.payload === 'string'
          ? action.payload
          : action.error?.message ?? 'Failed to update connection';
      throw new Error(messageText);
    },
    [connectionEntities, dispatch],
  );

  const cancelConnectionRequest = useCallback(
    async (connectionId: string) => {
      const existing = connectionEntities[connectionId];
      if (existing) {
        dispatch(removeConnection(connectionId));
      }

      const action = await dispatch(cancelConnectionRequestThunk({ connectionId }));

      if (cancelConnectionRequestThunk.fulfilled.match(action)) {
        return;
      }

      if (existing) {
        dispatch(addConnection(existing));
      }

      const messageText =
        typeof action.payload === 'string'
          ? action.payload
          : action.error?.message ?? 'Failed to cancel connection request';
      throw new Error(messageText);
    },
    [connectionEntities, dispatch],
  );

  const getConnectionStatus = useCallback(
    (otherUserId: string): 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined' | 'blocked' => {
      if (!userId || !connections.length) {
        return 'none';
      }

      const connection = connections.find(
        (conn) =>
          (conn.requester_id === userId && conn.recipient_id === otherUserId) ||
          (conn.requester_id === otherUserId && conn.recipient_id === userId),
      );

      if (!connection) {
        return 'none';
      }

      if (connection.status === 'pending') {
        return connection.requester_id === userId ? 'pending_sent' : 'pending_received';
      }

      return connection.status;
    },
    [connections, userId],
  );

  const getConnectionId = useCallback(
    (otherUserId: string): string | null => {
      if (!userId || !connections.length) {
        return null;
      }

      const connection = connections.find(
        (conn) =>
          (conn.requester_id === userId && conn.recipient_id === otherUserId) ||
          (conn.requester_id === otherUserId && conn.recipient_id === userId),
      );

      return connection?.id ?? null;
    },
    [connections, userId],
  );

  const refreshConnections = useCallback(async () => {
    if (!userId) {
      dispatch(clearConnectionsAction());
      return;
    }

    const action = await dispatch(fetchConnections({ force: true }));

    if (fetchConnections.rejected.match(action)) {
      const messageText =
        typeof action.payload === 'string'
          ? action.payload
          : action.error?.message ?? 'Failed to refresh connections';
      throw new Error(messageText);
    }
  }, [dispatch, userId]);

  return useMemo(
    () => ({
      connections,
      loading,
      error,
      sendConnectionRequest,
      updateConnectionStatus,
      cancelConnectionRequest,
      getConnectionStatus,
      getConnectionId,
      refreshConnections,
    }),
    [
      cancelConnectionRequest,
      connections,
      error,
      getConnectionId,
      getConnectionStatus,
      loading,
      refreshConnections,
      sendConnectionRequest,
      updateConnectionStatus,
    ],
  );
}
