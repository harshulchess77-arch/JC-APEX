import { supabase } from './supabaseClient';

const PIT_SYSTEM_USER = {
  email: 'pitcrew@jc-apex.internal',
  password: 'ApexCrewPassword2026!'
};

/**
 * Ensures the Supabase client has an active authenticated session
 * to satisfy table RLS write policies on `drivers` / `driver_profiles`.
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
 * Tries `drivers` table first, falls back to `driver_profiles` if existing.
 */
export async function getDriverProfiles() {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drivers from Supabase:', error);
      // Fallback check
      const fallback = await supabase.from('driver_profiles').select('*');
      if (!fallback.error && fallback.data) return fallback.data;
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('getDriverProfiles exception:', err);
    return [];
  }
}

/**
 * Upserts / saves a driver profile to Supabase with proper RLS credentials and type normalization.
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

  if (driverId) {
    const { data, error } = await supabase
      .from('drivers')
      .update(payload)
      .eq('id', driverId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update driver profile in Supabase:', error.message);
      throw error;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from('drivers')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Failed to insert driver profile in Supabase:', error.message);
      throw error;
    }
    return data;
  }
}

/**
 * Deletes a driver profile by id.
 */
export async function deleteDriverProfile(driverId) {
  if (!driverId) return false;
  await ensureAuthenticatedSession();

  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', driverId);

  if (error) {
    console.error('Failed to delete driver profile in Supabase:', error.message);
    throw error;
  }
  return true;
}
