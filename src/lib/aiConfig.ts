// AI Configuration Service - Manages Gemini API key in Supabase

import { supabase } from './supabase';

const USER_ID_STORAGE_KEY = 'junon_user_id';
const USER_IP_KEY = 'junon_user_ip';
const USER_FINGERPRINT_KEY = 'junon_user_fingerprint';

/**
 * Get user's IP address using a public API
 */
async function getUserIP(): Promise<string> {
  try {
    // Try multiple IP services for reliability
    const services = [
      'https://api.ipify.org?format=json',
      'https://api64.ipify.org?format=json',
      'https://ipapi.co/json/',
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          const ip = data.ip || data.query || data.IPv4;
          if (ip) {
            // Cache IP in localStorage
            localStorage.setItem(USER_IP_KEY, ip);
            return ip;
          }
        }
      } catch (error) {
        // Try next service
        continue;
      }
    }
    
    // Fallback to cached IP if available
    const cachedIP = localStorage.getItem(USER_IP_KEY);
    if (cachedIP) return cachedIP;
    
    return 'unknown';
  } catch (error) {
    console.error('Error fetching IP:', error);
    const cachedIP = localStorage.getItem(USER_IP_KEY);
    return cachedIP || 'unknown';
  }
}

/**
 * Get browser/computer fingerprint
 */
function getBrowserFingerprint(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const navigator = window.navigator;
  const screen = window.screen;
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    navigator.hardwareConcurrency || 'unknown',
    navigator.deviceMemory || 'unknown',
    new Date().getTimezoneOffset(),
  ].join('|');
  
  return fingerprint;
}

/**
 * Create a hash from a string (simple hash function)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get or create a unique user ID based on IP and computer fingerprint
 * This ID is used to identify the user in Supabase without authentication
 */
async function getOrCreateUserId(): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  // Check if we already have a user ID
  let userId = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (userId) {
    return userId;
  }
  
  // Get IP address
  const ip = await getUserIP();
  
  // Get browser fingerprint
  const fingerprint = getBrowserFingerprint();
  localStorage.setItem(USER_FINGERPRINT_KEY, fingerprint);
  
  // Combine IP and fingerprint to create a unique ID
  const combined = `${ip}|${fingerprint}`;
  const hash = simpleHash(combined);
  
  // Create user ID: ip_hash + fingerprint_hash
  userId = `user_${simpleHash(ip)}_${hash.substring(0, 12)}`;
  
  // Store in localStorage for future use
  localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  
  return userId;
}

/**
 * Get the stored Gemini API key from Supabase
 * @returns The API key or null if not found
 */
export async function getApiKey(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const userId = await getOrCreateUserId();
    const { data, error } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.api_key;
  } catch (error) {
    console.error('Error fetching API key:', error);
    return null;
  }
}

/**
 * Save the Gemini API key to Supabase
 * @param key The API key to save
 */
export async function setApiKey(key: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const userId = await getOrCreateUserId();
    const trimmedKey = key.trim();
    
    // Try to update existing record first
    const { data: existing } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('api_keys')
        .update({ api_key: trimmedKey, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      
      if (updateError) {
        throw new Error(`Failed to update API key: ${updateError.message}`);
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          api_key: trimmedKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (insertError) {
        throw new Error(`Failed to save API key: ${insertError.message}`);
      }
    }
  } catch (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
}

/**
 * Check if an API key exists in Supabase
 * @returns true if API key exists, false otherwise
 */
export async function hasApiKey(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const userId = await getOrCreateUserId();
    const { data, error } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    return !error && data !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Remove the API key from Supabase (useful for testing or reset)
 */
export async function clearApiKey(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const userId = await getOrCreateUserId();
    await supabase
      .from('api_keys')
      .delete()
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error clearing API key:', error);
  }
}

/**
 * Validate basic format of Gemini API key
 * Gemini API keys typically start with "AI" and are alphanumeric
 * @param key The API key to validate
 * @returns true if format looks valid, false otherwise
 */
export function validateApiKeyFormat(key: string): boolean {
  if (!key || key.trim().length < 10) return false;
  // Basic validation: should be alphanumeric and reasonably long
  return /^[A-Za-z0-9_-]+$/.test(key.trim());
}

