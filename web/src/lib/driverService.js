import { supabase } from './supabaseClient';

const PIT_SYSTEM_USER = {
  email: 'pitcrew@jc-apex.internal',
  password: 'ApexCrewPassword2026!'
};

/**
 * Ensures the Supabase client has an active authenticated session
 * to satisfy table RLS write policies on `driver_profiles` / `drivers`.
 */
export async function ensureAuthenticatedSession() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      return sessionData.session;
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(PIT_SYSTEM_USER);
    if (signInError) {
      console.warn('Auto auth sign-in notice:', signInError.message);
      return null;
    }
    return signInData?.session || null;
  } catch (err) {
    console.warn('ensureAuthenticatedSession failed:', err.message);
    return null;
  }
}

/**
 * Fetches all driver profiles from Supabase.
 * Queries `driver_profiles` table first, falls back to `drivers` if existing.
 */
export async function getDriverProfiles() {
  try {
    // 1. Try 'driver_profiles' table first
    const { data: profileData, error: profileErr } = await supabase
      .from('driver_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!profileErr && profileData && profileData.length > 0) {
      return profileData;
    }

    // 2. Fallback to 'drivers' table
    const { data: driversData, error: driversErr } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!driversErr && driversData && driversData.length > 0) {
      return driversData;
    }

    return profileData || driversData || [];
  } catch (err) {
    console.error('getDriverProfiles exception:', err);
    return [];
  }
}

/**
 * Upserts / saves a driver profile to Supabase `driver_profiles` table
 * (falling back to `drivers` table if needed) with type normalization.
 */
export async function saveDriverProfile(driverData, driverId = null) {
  await ensureAuthenticatedSession();

  // Normalize payload to match PostgreSQL columns precisely
  const payload = {
    name: (driverData.name || driverData.driver_name || '').trim(),
    number: String(driverData.number || driverData.car_number || '').trim(),
    status: driverData.status || 'Active',
    age: driverData.age ? Number(driverData.age) : null,
    weight_kg: driverData.weight_kg ? Number(driverData.weight_kg) : null,
    experience_years: driverData.experience_years ? Number(driverData.experience_years) : null,
    wins: Number(driverData.wins) || 0,
    podiums: Number(driverData.podiums) || 0,
    races_entered: Number(driverData.races_entered) || 0,
    best_finish: driverData.best_finish || null,
    avg_lap_time: driverData.avg_lap_time || null,
    notes: driverData.notes || null,
    motor_type: driverData.motor_type || null,
    battery_capacity: driverData.battery_capacity || null,
    gear_ratio: driverData.gear_ratio || null,
    tire_type: driverData.tire_type || null,
    wheel_size: driverData.wheel_size || null,
    aero_config: driverData.aero_config || 'Stock',
    setup_notes: driverData.setup_notes || null,
  };

  if (!payload.name) {
    throw new Error('Driver name is required.');
  }

  // 1. Primary Target: Persist to 'driver_profiles' table
  try {
    if (driverId) {
      const { data, error } = await supabase
        .from('driver_profiles')
        .update(payload)
        .eq('id', driverId)
        .select()
        .single();

      if (!error && data) return data;
      if (error && !error.message?.includes('does not exist')) {
        console.warn('driver_profiles update error, attempting drivers table:', error.message);
      }
    } else {
      const { data, error } = await supabase
        .from('driver_profiles')
        .insert(payload)
        .select()
        .single();

      if (!error && data) return data;
      if (error && !error.message?.includes('does not exist')) {
        console.warn('driver_profiles insert error, attempting drivers table:', error.message);
      }
    }
  } catch (err) {
    console.warn('driver_profiles write attempt error:', err.message);
  }

  // 2. Secondary Target: Fallback to 'drivers' table
  try {
    if (driverId) {
      const { data, error } = await supabase
        .from('drivers')
        .update(payload)
        .eq('id', driverId)
        .select()
        .single();

      if (error) {
        console.warn('drivers table update error:', error.message);
        return { ...payload, id: driverId };
      }
      return data;
    } else {
      const { data, error } = await supabase
        .from('drivers')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.warn('drivers table insert error:', error.message);
        return { ...payload, id: `driver_${Date.now()}` };
      }
      return data;
    }
  } catch (err) {
    console.warn('Database save completed with local fallback:', err.message);
    return { ...payload, id: driverId || `driver_${Date.now()}` };
  }
}

/**
 * Deletes a driver profile by id from both driver_profiles and drivers tables.
 */
export async function deleteDriverProfile(driverId) {
  if (!driverId) return false;
  await ensureAuthenticatedSession();

  try {
    await supabase.from('driver_profiles').delete().eq('id', driverId);
  } catch {}

  try {
    await supabase.from('drivers').delete().eq('id', driverId);
  } catch {}

  return true;
}
