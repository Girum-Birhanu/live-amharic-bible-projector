import { ProjectorSyncPayload } from '../types';
import { BROADCAST_CHANNEL_NAME, PEER_TIMEOUT_MS, HEARTBEAT_INTERVAL_MS } from '../utils/constants';

/**
 * Multi-display / OBS overlay synchronization manager via BroadcastChannel API
 */
export class BroadcastSyncManager {
  private channel: BroadcastChannel | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  public readonly instanceId: string;

  constructor() {
    this.instanceId = 'op-' + Math.random().toString(36).slice(2, 8);
  }

  init(onMessage: (msg: ProjectorSyncPayload) => void): void {
    if (typeof BroadcastChannel === 'undefined') return;
    this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    this.channel.onmessage = (event: MessageEvent<ProjectorSyncPayload>) => {
      const msg = event.data;
      if (!msg || msg.senderId === this.instanceId) return;
      onMessage(msg);
    };
  }

  postMessage(payload: ProjectorSyncPayload): void {
    this.channel?.postMessage(payload);
  }

  startHeartbeat(onPeerUpdate?: (peerId: string, timestamp: number) => void): void {
    this.heartbeatInterval = setInterval(() => {
      this.postMessage({
        type: 'PING',
        senderId: this.instanceId,
        timestamp: Date.now()
      });
      if (onPeerUpdate) {
        onPeerUpdate(this.instanceId, Date.now());
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  destroy(): void {
    this.stopHeartbeat();
    this.channel?.close();
    this.channel = null;
  }

  static cleanStalePeers(peers: Record<string, number>): Record<string, number> {
    const now = Date.now();
    const next: Record<string, number> = {};
    for (const [peerId, lastSeen] of Object.entries(peers)) {
      if (now - lastSeen < PEER_TIMEOUT_MS) {
        next[peerId] = lastSeen;
      }
    }
    return next;
  }
}
