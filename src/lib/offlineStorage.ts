// ============================================================================
// Offline Storage – Pending Listings Queue
// ============================================================================
// When a farmer submits a listing while their device is offline the form data
// is persisted here.  When connectivity is restored the app reads this queue
// and syncs every entry to the server, then clears it.
// ============================================================================

import type { CreateListingRequest } from './types';

const PENDING_LISTINGS_KEY = 'v2m_pending_listings';

export interface PendingListing {
  /** Client-generated temporary id (e.g. crypto.randomUUID()) */
  localId: string;
  data: CreateListingRequest & {
    /** Extra display fields captured from the form but not sent to the API */
    produceName?: string;
    categoryName?: string;
    districtName?: string;
    deliveryAvailable?: boolean;
    negotiable?: boolean;
  };
  savedAt: string; // ISO timestamp
  synced: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Read / Write helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getPendingListings(): PendingListing[] {
  try {
    const raw = localStorage.getItem(PENDING_LISTINGS_KEY);
    return raw ? (JSON.parse(raw) as PendingListing[]) : [];
  } catch {
    return [];
  }
}

export function savePendingListing(
  data: PendingListing['data']
): PendingListing {
  const entry: PendingListing = {
    localId: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    data,
    savedAt: new Date().toISOString(),
    synced: false,
  };

  const existing = getPendingListings();
  localStorage.setItem(
    PENDING_LISTINGS_KEY,
    JSON.stringify([...existing, entry])
  );
  return entry;
}

export function markListingSynced(localId: string): void {
  const listings = getPendingListings().map((l) =>
    l.localId === localId ? { ...l, synced: true } : l
  );
  localStorage.setItem(PENDING_LISTINGS_KEY, JSON.stringify(listings));
}

export function removeSyncedListings(): void {
  const unsyncedOnly = getPendingListings().filter((l) => !l.synced);
  localStorage.setItem(PENDING_LISTINGS_KEY, JSON.stringify(unsyncedOnly));
}

export function clearAllPendingListings(): void {
  localStorage.removeItem(PENDING_LISTINGS_KEY);
}

export function hasPendingListings(): boolean {
  return getPendingListings().some((l) => !l.synced);
}
