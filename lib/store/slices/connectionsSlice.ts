import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/lib/store/types';

const CACHE_TTL_MS = 5 * 60 * 1000;

export interface ConnectionProfileSummary {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  chapter: string | null;
  avatar_url: string | null;
}

export interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  message?: string;
  created_at: string;
  updated_at: string;
  requester: ConnectionProfileSummary;
  recipient: ConnectionProfileSummary;
}

export interface ConnectionsState {
  entities: Record<string, Connection>;
  ids: string[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: ConnectionsState = {
  entities: {},
  ids: [],
  loading: false,
  error: null,
  lastFetched: null,
};

const normalizeConnections = (connections: Connection[]) => {
  const entities: Record<string, Connection> = {};
  const ids = connections
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((connection) => {
      entities[connection.id] = connection;
      return connection.id;
    });

  return { entities, ids };
};

export const fetchConnections = createAsyncThunk<
  Connection[],
  { force?: boolean } | undefined,
  { state: RootState; rejectValue: string }
>(
  'connections/fetchConnections',
  async ({ force } = {}, { getState, rejectWithValue }) => {
    const state = getState();
    const userId = state.auth.user?.id;

    if (!userId) {
      return [];
    }

    try {
      const response = await fetch(`/api/connections?userId=${userId}`);

      if (!response.ok) {
        const { error } = await response.json();
        return rejectWithValue(error ?? 'Failed to fetch connections');
      }

      const data = await response.json();
      return (data.connections ?? []) as Connection[];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch connections';
      return rejectWithValue(message);
    }
  },
  {
    condition: ({ force } = {}, { getState }) => {
      const state = getState();
      const userId = state.auth.user?.id;

      if (!userId) {
        return false;
      }

      if (force) {
        return true;
      }

      const lastFetched = state.connections.lastFetched;

      if (!lastFetched) {
        return true;
      }

      const isFresh = Date.now() - lastFetched < CACHE_TTL_MS;
      return !isFresh;
    },
  },
);

export const sendConnectionRequest = createAsyncThunk<
  Connection,
  { recipientId: string; message?: string },
  { state: RootState; rejectValue: string }
>('connections/sendConnectionRequest', async ({ recipientId, message }, { getState, rejectWithValue }) => {
  const state = getState();
  const userId = state.auth.user?.id;

  if (!userId) {
    return rejectWithValue('User not authenticated');
  }

  try {
    const response = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId: userId, recipientId, message }),
    });

    if (!response.ok) {
      const { error } = await response.json();
      return rejectWithValue(error ?? 'Failed to send connection request');
    }

    const data = await response.json();
    return data.connection as Connection;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send connection request';
    return rejectWithValue(message);
  }
});

export const updateConnectionStatus = createAsyncThunk<
  Connection,
  { connectionId: string; status: 'accepted' | 'declined' | 'blocked' },
  { rejectValue: string }
>('connections/updateConnectionStatus', async ({ connectionId, status }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const { error } = await response.json();
      return rejectWithValue(error ?? 'Failed to update connection');
    }

    const data = await response.json();
    return data.connection as Connection;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update connection';
    return rejectWithValue(message);
  }
});

export const cancelConnectionRequest = createAsyncThunk<
  string,
  { connectionId: string },
  { rejectValue: string }
>('connections/cancelConnectionRequest', async ({ connectionId }, { rejectWithValue }) => {
  try {
    const response = await fetch(`/api/connections/${connectionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const { error } = await response.json();
      return rejectWithValue(error ?? 'Failed to cancel connection request');
    }

    return connectionId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel connection request';
    return rejectWithValue(message);
  }
});

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    setConnections(state, action: PayloadAction<Connection[]>) {
      const { entities, ids } = normalizeConnections(action.payload);
      state.entities = entities;
      state.ids = ids;
      state.error = null;
      state.lastFetched = Date.now();
    },
    addConnection(state, action: PayloadAction<Connection>) {
      const connection = action.payload;
      state.entities[connection.id] = connection;
      if (!state.ids.includes(connection.id)) {
        state.ids.unshift(connection.id);
      }
    },
    updateConnection(state, action: PayloadAction<{ id: string; changes: Partial<Connection> }>) {
      const { id, changes } = action.payload;
      const existing = state.entities[id];
      if (existing) {
        state.entities[id] = { ...existing, ...changes };
      }
    },
    removeConnection(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.entities[id]) {
        delete state.entities[id];
        state.ids = state.ids.filter((connectionId) => connectionId !== id);
      }
    },
    clearConnections(state) {
      state.entities = {};
      state.ids = [];
      state.loading = false;
      state.error = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConnections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConnections.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const { entities, ids } = normalizeConnections(action.payload);
        state.entities = entities;
        state.ids = ids;
        state.lastFetched = Date.now();
      })
      .addCase(fetchConnections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error?.message ?? 'Failed to fetch connections';
      })
      .addCase(sendConnectionRequest.pending, (state) => {
        state.error = null;
      })
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        const connection = action.payload;
        state.entities[connection.id] = connection;
        if (!state.ids.includes(connection.id)) {
          state.ids.unshift(connection.id);
        }
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.error = action.payload ?? action.error?.message ?? 'Failed to send connection request';
      })
      .addCase(updateConnectionStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateConnectionStatus.fulfilled, (state, action) => {
        const connection = action.payload;
        if (state.entities[connection.id]) {
          state.entities[connection.id] = connection;
        } else {
          state.entities[connection.id] = connection;
          state.ids.unshift(connection.id);
        }
      })
      .addCase(updateConnectionStatus.rejected, (state, action) => {
        state.error = action.payload ?? action.error?.message ?? 'Failed to update connection';
      })
      .addCase(cancelConnectionRequest.pending, (state) => {
        state.error = null;
      })
      .addCase(cancelConnectionRequest.fulfilled, (state, action) => {
        const id = action.payload;
        if (state.entities[id]) {
          delete state.entities[id];
          state.ids = state.ids.filter((connectionId) => connectionId !== id);
        }
      })
      .addCase(cancelConnectionRequest.rejected, (state, action) => {
        state.error = action.payload ?? action.error?.message ?? 'Failed to cancel connection request';
      });
  },
});

export const {
  setConnections,
  addConnection,
  updateConnection,
  removeConnection,
  clearConnections,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;

export const selectConnectionsState = (state: RootState) => state.connections;

export const selectConnectionEntities = (state: RootState) => state.connections.entities;

export const selectConnectionIds = (state: RootState) => state.connections.ids;

export const selectAllConnections = (state: RootState) =>
  state.connections.ids.map((id) => state.connections.entities[id]).filter(Boolean) as Connection[];

export const selectConnectionById = (state: RootState, id: string) => state.connections.entities[id] ?? null;

export const selectConnectionStatus = (
  state: RootState,
  currentUserId: string | undefined,
  otherUserId: string,
): 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined' | 'blocked' => {
  if (!currentUserId) {
    return 'none';
  }

  const connections = selectAllConnections(state);
  const connection = connections.find(
    (conn) =>
      (conn.requester_id === currentUserId && conn.recipient_id === otherUserId) ||
      (conn.requester_id === otherUserId && conn.recipient_id === currentUserId),
  );

  if (!connection) {
    return 'none';
  }

  if (connection.status === 'pending') {
    return connection.requester_id === currentUserId ? 'pending_sent' : 'pending_received';
  }

  return connection.status;
};

export const selectConnectionIdForUser = (state: RootState, currentUserId: string | undefined, otherUserId: string) => {
  if (!currentUserId) {
    return null;
  }

  const connections = selectAllConnections(state);
  const connection = connections.find(
    (conn) =>
      (conn.requester_id === currentUserId && conn.recipient_id === otherUserId) ||
      (conn.requester_id === otherUserId && conn.recipient_id === currentUserId),
  );

  return connection?.id ?? null;
};

export { CACHE_TTL_MS };

