import { useEffect, useState } from 'react';
import {
    createTLStore,
    defaultShapeUtils,
    throttle,
    type TLRecord,
    type TLStoreWithStatus,
} from '@tldraw/tldraw';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

// This hook handles our real-time P2P sync using Yjs and WebRTC
// It's basically the "brain" of our multiplayer whiteboard
export function useYjsStore({ roomId, hostUrl }: { roomId: string; hostUrl: string }) {
    const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus & { peerCount: number }>({
        status: 'loading',
        peerCount: 1
    });

    useEffect(() => {
        // Create a local tldraw store
        const store = createTLStore({ shapeUtils: defaultShapeUtils });

        // Setup Yjs document - our "shared memory"
        const ydoc = new Y.Doc();

        // Connect to the P2P network via our signaling server
        const provider = new WebrtcProvider(roomId, ydoc, {
            signaling: [hostUrl],
        });

        // The shared map where all our whiteboard data lives
        const yStore = ydoc.getMap<TLRecord>('tldraw');

        // Track how many people are in the room
        const handleAwareness = () => {
            const count = provider.awareness.getStates().size;
            setStoreWithStatus(s => ({ ...s, peerCount: count || 1 }));
        };
        provider.awareness.on('change', handleAwareness);

        // Filter for records that are local-only (like camera zoom or pointers)
        // We don't want to sync these or everyone's screens would jump around!
        const isLocalOnly = (record: TLRecord) => {
            return [
                'camera',
                'instance',
                'instance_page_state',
                'page_states',
                'pointer',
                'instance_presence'
            ].includes(record.typeName);
        };

        // --- 1. SENDING CHANGES (Tldraw -> Yjs) ---
        const unlisten = store.listen(
            throttle((history) => {
                // If the change came from another user, don't send it back!
                if (history.source === 'remote') return;

                const { added, updated, removed } = history.changes;
                ydoc.transact(() => {
                    if (added) {
                        Object.values(added).forEach((record) => {
                            const r = record as TLRecord;
                            if (!isLocalOnly(r)) yStore.set(r.id, r);
                        });
                    }
                    if (updated) {
                        Object.values(updated).forEach((update) => {
                            const [, record] = update as [TLRecord, TLRecord];
                            if (!isLocalOnly(record)) yStore.set(record.id, record);
                        });
                    }
                    if (removed) {
                        Object.values(removed).forEach((record) => {
                            const r = record as TLRecord;
                            if (!isLocalOnly(r)) yStore.delete(r.id);
                        });
                    }
                });
            }, 16)
        );

        // --- 2. RECEIVING CHANGES (Yjs -> Tldraw) ---
        const handleYUpdate = (e: Y.YMapEvent<TLRecord>) => {
            if (e.transaction.local) return;

            const toPut: TLRecord[] = [];
            const toRemove: string[] = [];

            e.changes.keys.forEach((change, id) => {
                switch (change.action) {
                    case 'add':
                    case 'update': {
                        const record = yStore.get(id);
                        if (record) toPut.push(record);
                        break;
                    }
                    case 'delete': {
                        toRemove.push(id as any);
                        break;
                    }
                }
            });

            // Update our local whiteboard with the new data from peers
            if (toPut.length > 0 || toRemove.length > 0) {
                store.mergeRemoteChanges(() => {
                    if (toRemove.length > 0) store.remove(toRemove as any);
                    if (toPut.length > 0) store.put(toPut);
                });
            }
        };

        yStore.observe(handleYUpdate);

        // Initial sync when we first join the room
        const handleSync = () => {
            const records = Array.from(yStore.values()).filter(r => !isLocalOnly(r));
            if (records.length > 0) {
                store.mergeRemoteChanges(() => {
                    store.put(records);
                });
            }
            setStoreWithStatus(s => ({
                ...s,
                status: 'synced-remote' as any,
                store
            }));
        };

        provider.on('synced', handleSync);

        // Cleanup everything when the component unmounts
        return () => {
            unlisten();
            yStore.unobserve(handleYUpdate);
            provider.awareness.off('change', handleAwareness);
            provider.off('synced', handleSync);
            provider.destroy();
            ydoc.destroy();
        };
    }, [roomId, hostUrl]);

    return storeWithStatus;
}
