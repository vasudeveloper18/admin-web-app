import { Radio } from 'lucide-react';
import { BRAND } from '@/lib/branding';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitle?: string;
}

const SIZES = {
  sm: { box: 32, icon: 16, title: 13, subtitle: 10 },
  md: { box: 36, icon: 18, title: 14, subtitle: 11 },
  lg: { box: 56, icon: 28, title: 24, subtitle: 13 },
};

export function BrandLogo({ size = 'md', showSubtitle = false, subtitle }: BrandLogoProps) {
  const s = SIZES[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'lg' ? 0 : 12, flexDirection: size === 'lg' ? 'column' : 'row', textAlign: size === 'lg' ? 'center' : 'left' }}>
      <div
        style={{
          width: s.box,
          height: s.box,
          borderRadius: size === 'lg' ? 16 : 10,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          flexShrink: 0,
          marginBottom: size === 'lg' ? 16 : 0,
        }}
      >
        <Radio size={s.icon} color="white" strokeWidth={2.5} />
      </div>
      <div>
        <div style={{ fontSize: s.title, fontWeight: 700, color: '#f0f2f8', lineHeight: 1.2 }}>
          {size === 'lg' ? BRAND.adminPanelTitle : BRAND.adminPanelTitle}
        </div>
        {showSubtitle && (
          <div style={{ fontSize: s.subtitle, color: '#8b92a9', marginTop: 2 }}>
            {subtitle ?? BRAND.tagline}
          </div>
        )}
      </div>
    </div>
  );
}
