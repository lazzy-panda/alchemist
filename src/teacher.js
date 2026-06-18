// src/teacher.js — teacher-ambassador client helpers + hook
import { useEffect, useState, useCallback } from 'react';
import {
  enableTeacherMode, loadTeacher, saveTeacherProgram,
  loadTeacherDashboard, loadRevshareEstimate,
} from './supabase';

// pricing params for the rev-share ESTIMATE shown to teachers (not authoritative payout)
const PRICE_RUB = 250;       // ≈ monthly Stars price in ₽
const TELEGRAM_NET = 0.7;    // after ~30% Telegram fee
const SHARE_PCT = 0.4;       // teacher's share of net (spec default 40%)

export function revshareEstimateRub(payingCount) {
  return Math.round((payingCount || 0) * PRICE_RUB * TELEGRAM_NET * SHARE_PCT);
}
export function weekPctLabel(ratio) {
  return Math.round((ratio || 0) * 100) + '%';
}

// teacher-side state: their referral code, program, dashboard rows, rev-share estimate
export function useTeacher(userId) {
  const [teacher, setTeacher] = useState(null);   // { referral_code, program } | null
  const [rows, setRows] = useState([]);
  const [paying, setPaying] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const t = await loadTeacher(userId);
    setTeacher(t);
    if (t) {
      setRows(await loadTeacherDashboard());
      setPaying(await loadRevshareEstimate());
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const enable = useCallback(async () => {
    const code = await enableTeacherMode();
    if (code) await refresh();
    return code;
  }, [refresh]);

  const setProgram = useCallback(async (program) => {
    await saveTeacherProgram(program);
    await refresh();
  }, [refresh]);

  return { teacher, rows, paying, loading, refresh, enable, setProgram };
}
