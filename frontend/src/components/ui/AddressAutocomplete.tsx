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
  coordinatesSet?: boolean;
}

export function AddressAutocomplete({ value, onChange, error, disabled, coordinatesSet }: AddressAutocompleteProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<GeoapifyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipFetchRef = useRef(false);
  const committedAddressRef = useRef<string | null>(null);
  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    setInput(value);
    if (value && coordinatesSet && value === committedAddressRef.current) {
      skipFetchRef.current = true;
    }
  }, [value, coordinatesSet]);

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
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }

    const query = input.trim();
    if (query.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (coordinatesSet && query === committedAddressRef.current) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      const generation = ++fetchGenerationRef.current;
      setLoading(true);
      setLookupError(null);
      try {
        const res = await fetch(`/api/geoapify/autocomplete?text=${encodeURIComponent(query)}`, {
          credentials: 'same-origin',
        });
        const data = await res.json();

        if (generation !== fetchGenerationRef.current) {
          return;
        }

        if (!res.ok) {
          const message =
            data.message ||
            (res.status === 401 ? 'Session expired — please sign in again' : 'Address lookup unavailable');
          setLookupError(message);
          setSuggestions([]);
          setOpen(false);
          return;
        }

        const results: GeoapifyResult[] = data.results || [];
        setSuggestions(results);
        if (coordinatesSet && query === committedAddressRef.current) {
          setOpen(false);
        } else {
          setOpen(results.length > 0);
        }
      } catch {
        setLookupError('Address lookup failed');
        setSuggestions([]);
        setOpen(false);
      } finally {
        if (generation === fetchGenerationRef.current) {
          setLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [input, coordinatesSet]);

  const handleSelect = (result: GeoapifyResult) => {
    fetchGenerationRef.current += 1;
    skipFetchRef.current = true;
    committedAddressRef.current = result.formatted;
    setInput(result.formatted);
    setSuggestions([]);
    setOpen(false);
    setLoading(false);
    setLookupError(null);
    onChange({ address: result.formatted, latitude: result.lat, longitude: result.lon });
  };

  return (
    <div ref={containerRef} className="address-autocomplete">
      <div className="address-autocomplete__input-wrap">
        <MapPin size={15} className="address-autocomplete__icon" />
        <input
          type="text"
          value={input}
          disabled={disabled}
          placeholder="Start typing an address…"
          onChange={(e) => {
            const nextValue = e.target.value;
            committedAddressRef.current = null;
            skipFetchRef.current = false;
            setInput(nextValue);
            setOpen(true);
            onChange({ address: nextValue, latitude: 0, longitude: 0 });
          }}
          onFocus={() => {
            if (coordinatesSet && input === committedAddressRef.current) {
              return;
            }
            if (suggestions.length > 0) {
              setOpen(true);
            }
          }}
          aria-autocomplete="list"
          aria-expanded={open}
          className={`address-autocomplete__input${error ? ' address-autocomplete__input--error' : ''}`}
        />
        {loading && <Loader2 size={15} className="address-autocomplete__loader animate-spin" />}
      </div>

      {lookupError && (
        <p className="address-autocomplete__hint address-autocomplete__hint--warning">{lookupError}</p>
      )}

      {!error && !lookupError && input.trim().length >= 1 && !loading && suggestions.length === 0 && open && (
        <p className="address-autocomplete__hint address-autocomplete__hint--warning">No addresses found. Try a different search.</p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="address-autocomplete__list">
          {suggestions.map((result, i) => (
            <li key={i}>
              <button
                type="button"
                className="address-autocomplete__option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(result)}
              >
                <MapPin size={14} />
                <span>{result.formatted}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {coordinatesSet && !error && (
        <p className="address-autocomplete__hint">Location coordinates saved for this address.</p>
      )}

      {error && <p className="address-autocomplete__hint address-autocomplete__hint--error">{error}</p>}
    </div>
  );
}
