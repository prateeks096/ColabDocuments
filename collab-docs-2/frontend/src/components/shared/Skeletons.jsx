function Bone({ width = '100%', height = '16px', radius = '6px', style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, var(--paper-2) 25%, var(--paper-3) 50%, var(--paper-2) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      flexShrink: 0,
      ...style,
    }} />
  );
}

export function DocCardSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: 'white', border: '1px solid var(--paper-3)',
      borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <Bone width="36px" height="36px" radius="6px" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Bone width="55%" height="14px" />
        <Bone width="30%" height="11px" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[1, 2, 3, 4].map(i => <DocCardSkeleton key={i} />)}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div style={{
      width: '100%', maxWidth: '720px', margin: '2.5rem auto',
      background: 'white', borderRadius: 'var(--radius)',
      border: '1px solid var(--paper-3)', padding: '3rem 4rem',
      display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
      <Bone width="60%" height="28px" radius="6px" />
      <Bone width="100%" height="14px" />
      <Bone width="90%" height="14px" />
      <Bone width="95%" height="14px" />
      <Bone width="40%" height="14px" />
      <div style={{ height: '8px' }} />
      <Bone width="100%" height="14px" />
      <Bone width="85%" height="14px" />
      <Bone width="70%" height="14px" />
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
