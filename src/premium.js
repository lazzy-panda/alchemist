import { useEffect, useState } from 'react';
import { loadEntitlements } from './supabase';

export function isPremiumActive(ent) {
  if (!ent || !ent.premium) return false;
  if (!ent.premium_until) return true;
  return new Date(ent.premium_until).getTime() > Date.now();
}

export function usePremium(userId) {
  const [ent, setEnt] = useState(null);
  const refresh = () => { if (userId) loadEntitlements(userId).then(setEnt); };
  useEffect(() => { refresh(); }, [userId]);
  return { premium: isPremiumActive(ent), refresh };
}
