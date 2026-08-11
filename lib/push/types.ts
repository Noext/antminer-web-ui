export interface StoredPushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
  userAgent: string | null;
}

export interface PushPayload {
  title: string;
  body: string;
  tag: string;
  url?: string;
}
