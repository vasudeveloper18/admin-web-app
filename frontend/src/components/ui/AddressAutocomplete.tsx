'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export interface AddressSelection {
  address: string;
  latitude: number;
  longitude: number;
}

interface GeoapifyResult {
  formatted: string;
  lat: number;
  lon: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (selection: AddressSelection) => void;
  error?: string;
  disabled?: boolean;
}

export function AddressAutocomplete({ value, onChange, error, disabled }: AddressAutocompleteProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<GeoapifyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (input.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setLookupError(null);
      try {
        const res = await fetch(`/api/geoapify/autocomplete?text=${encodeURIComponent(input.trim())}`);
        const data = await res.json();

        if (!res.ok) {
          setLookupError(data.message || 'Address lookup unavailable');
          setSuggestions([]);
          setOpen(false);
          return;
        }

        const results: GeoapifyResult[] = (data.results || []).map((item: GeoapifyResult & { properties?: GeoapifyResult }) =>
          item.properties ? { formatted: item.properties.formatted, lat: item.properties.lat, lon: item.properties.lon } : item
        );
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setLookupError('Address lookup failed');
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [input]);

  const handleSelect = (result: GeoapifyResult) => {
    setInput(result.formatted);
    setOpen(false);
    onChange({ address: result.formatted, latitude: result.lat, longitude: result.lon });
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <MapPin
          size={15}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#8b92a9',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={input}
          disabled={disabled}
          placeholder="Start typing an address…"
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          aria-autocomplete="list"
          aria-expanded={open}
          className="w-full px-3 py-2 pl-9 rounded-xl bg-opacity-80 bg-[#0f1117] border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-[#6366f1]"
          style={{
            borderColor: error ? 'rgba(239,68,68,0.5)' : undefined,
          }}
        />
        {loading && (
          <Loader2
            size={15}
            className="animate-spin"
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8b92a9',
            }}
          />
        )}
      </div>

      {lookupError && (
        <p className="mt-1 text-xs text-amber-400">{lookupError}</p>
      )}

      {!error && !lookupError && input.trim().length >= 3 && !loading && suggestions.length === 0 && open && (
        <p className="mt-1 text-xs text-amber-400">No addresses found. Try a different search.</p>
      )}

      <p className="mt-1 text-xs" style={{ color: '#8b92a9' }}>
        Select an address from the suggestions to set latitude and longitude.
      </p>

      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#1a1d27',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            overflow: 'hidden',
            zIndex: 50,
            listStyle: 'none',
            padding: 0,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {suggestions.map((result, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  color: '#c5cae0',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <MapPin size={14} style={{ flexShrink: 0, marginTop: 2, color: '#6366f1' }} />
                <span>{result.formatted}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
