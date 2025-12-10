'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';

interface StoreSettings {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  hours: Record<string, { open: string; close: string }> | null;
  is_open: boolean;
  prep_time_minutes: number;
}

const DEFAULT_HOURS: Record<string, { open: string; close: string }> = {
  monday: { open: '7:00 AM', close: '8:00 PM' },
  tuesday: { open: '7:00 AM', close: '8:00 PM' },
  wednesday: { open: '7:00 AM', close: '8:00 PM' },
  thursday: { open: '7:00 AM', close: '8:00 PM' },
  friday: { open: '7:00 AM', close: '9:00 PM' },
  saturday: { open: '8:00 AM', close: '9:00 PM' },
  sunday: { open: '8:00 AM', close: '6:00 PM' },
};

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .single();
      
      if (data) {
        setSettings(data);
      }
      setLoading(false);
    };
    load();
  }, []);

  return { settings, loading };
}

export function StoreHours({ compact = false }: { compact?: boolean }) {
  const { settings, loading } = useStoreSettings();
  const hours = settings?.hours || DEFAULT_HOURS;
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  
  const isCurrentlyOpen = () => {
    const todayHours = hours[today];
    if (!todayHours) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Parse open/close times (simple parsing for "7:00 AM" format)
    const parseTime = (timeStr: string) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const isPM = match[3].toUpperCase() === 'PM';
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    
    const openTime = parseTime(todayHours.open);
    const closeTime = parseTime(todayHours.close);
    
    return currentTime >= openTime && currentTime < closeTime;
  };

  const open = isCurrentlyOpen();

  if (loading) {
    return <div className="h-4 w-20 bg-stone-700 rounded animate-pulse" />;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${open ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className={`text-sm ${open ? 'text-green-400' : 'text-red-400'}`}>
          {open ? 'Open Now' : 'Closed'}
        </span>
        {open && hours[today] && (
          <span className="text-stone-500 text-sm">
            · until {hours[today].close}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${open ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className={`text-sm font-medium ${open ? 'text-green-400' : 'text-red-400'}`}>
          {open ? 'Open Now' : 'Closed'}
        </span>
      </div>
      {days.map((day) => {
        const dayHours = hours[day];
        const isToday = day === today;
        return (
          <div 
            key={day} 
            className={`flex justify-between text-sm ${isToday ? 'text-amber-400' : 'text-stone-500'}`}
          >
            <span className="capitalize">{day.slice(0, 3)}</span>
            <span>
              {dayHours ? `${dayHours.open} - ${dayHours.close}` : 'Closed'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function StoreContact() {
  const { settings, loading } = useStoreSettings();

  if (loading || !settings) {
    return null;
  }

  return (
    <div className="space-y-2 text-sm text-stone-500">
      <p>{settings.address}</p>
      <p>{settings.city}, {settings.state} {settings.zip}</p>
      {settings.phone && <p>{settings.phone}</p>}
      {settings.email && (
        <a href={`mailto:${settings.email}`} className="text-amber-400 hover:text-amber-300">
          {settings.email}
        </a>
      )}
    </div>
  );
}
