import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Profile {
  full_name: string | null;
  phone: string | null;
  phone_verified: boolean;
  trust_score: number;
}

// Module-level cache so all hook instances share the same data
let cachedProfile: Profile | null = null;
let listeners: Array<(p: Profile | null) => void> = [];

function notify(profile: Profile | null) {
  cachedProfile = profile;
  listeners.forEach((fn) => fn(profile));
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [loadingProfile, setLoadingProfile] = useState(!cachedProfile);

  useEffect(() => {
    listeners.push(setProfile);
    return () => {
      listeners = listeners.filter((fn) => fn !== setProfile);
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, phone_verified, trust_score")
      .eq("id", user.id)
      .maybeSingle();
    notify(data ?? null);
    setLoadingProfile(false);
  }, [user]);

  useEffect(() => {
    // Reset cache on user change
    if (!user) {
      notify(null);
      return;
    }
    fetchProfile();
  }, [user]);

  return { profile, loadingProfile, refetchProfile: fetchProfile };
}