import React from 'react';

type IconProps = {
  className?: string;
};

const Svg = ({ children, className, viewBox = '0 0 64 64' }: React.PropsWithChildren<IconProps & { viewBox?: string }>) => (
  <svg className={className} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

export const HeaderIcon = {
  search: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <line x1="2" y1="4.5" x2="14" y2="4.5" />
      <circle cx="6" cy="4.5" r="1.8" fill="#0b0a14" />
      <line x1="2" y1="11.5" x2="14" y2="11.5" />
      <circle cx="10.5" cy="11.5" r="1.8" fill="#0b0a14" />
    </svg>
  ),
  info: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6.2" />
      <line x1="8" y1="7.2" x2="8" y2="11" />
      <circle cx="8" cy="4.8" r="0.4" fill="currentColor" />
    </svg>
  ),
  close: (
    <svg width="13" height="13" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="2" y1="2" x2="12" y2="12" />
      <line x1="12" y1="2" x2="2" y2="12" />
    </svg>
  ),
  cash: (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3.5" width="12" height="7" rx="1.5" />
      <circle cx="7" cy="7" r="2" />
    </svg>
  ),
  bank: (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
      <polygon points="7,1 13,4.5 1,4.5" />
      <rect x="2.4" y="5.5" width="2" height="5" />
      <rect x="6" y="5.5" width="2" height="5" />
      <rect x="9.6" y="5.5" width="2" height="5" />
      <rect x="1" y="11.5" width="12" height="1.8" rx="0.9" />
    </svg>
  ),
  job: (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="4" width="11" height="8" rx="1.5" />
      <rect x="5" y="2" width="4" height="2.5" rx="1" />
    </svg>
  ),
};

const ghost = 'rgba(235,238,248,0.9)';

export const GhostIcon = {
  shirt: (
    <Svg>
      <rect x="20" y="16" width="24" height="36" rx="4" stroke={ghost} strokeWidth="3" />
      <rect x="10" y="16" width="12" height="20" rx="4" stroke={ghost} strokeWidth="3" />
      <rect x="42" y="16" width="12" height="20" rx="4" stroke={ghost} strokeWidth="3" />
    </Svg>
  ),
  vest: (
    <Svg>
      <rect x="16" y="16" width="32" height="34" rx="5" stroke={ghost} strokeWidth="3" />
      <rect x="22" y="26" width="20" height="4" rx="2" fill={ghost} />
      <rect x="22" y="36" width="20" height="4" rx="2" fill={ghost} />
    </Svg>
  ),
  bag: (
    <Svg>
      <rect x="16" y="16" width="32" height="38" rx="9" stroke={ghost} strokeWidth="3" />
      <rect x="24" y="10" width="16" height="9" rx="4" stroke={ghost} strokeWidth="3" />
      <rect x="22" y="34" width="20" height="14" rx="4" stroke={ghost} strokeWidth="2.5" />
    </Svg>
  ),
  glasses: (
    <Svg>
      <circle cx="20" cy="36" r="9" stroke={ghost} strokeWidth="3" />
      <circle cx="44" cy="36" r="9" stroke={ghost} strokeWidth="3" />
      <rect x="28" y="33" width="8" height="3" rx="1.5" fill={ghost} />
      <rect x="6" y="30" width="6" height="3" rx="1.5" fill={ghost} />
      <rect x="52" y="30" width="6" height="3" rx="1.5" fill={ghost} />
    </Svg>
  ),
  cap: (
    <Svg>
      <path d="M14 36a18 16 0 0 1 36 0Z" fill={ghost} />
      <rect x="30" y="34" width="26" height="6" rx="3" fill={ghost} />
    </Svg>
  ),
  watch: (
    <Svg>
      <rect x="26" y="8" width="12" height="14" rx="3" fill={ghost} />
      <rect x="26" y="42" width="12" height="14" rx="3" fill={ghost} />
      <circle cx="32" cy="32" r="11" stroke={ghost} strokeWidth="3.5" />
    </Svg>
  ),
  chain: (
    <Svg>
      {[14, 22, 32, 42, 50].map((x, index) => (
        <circle key={x} cx={x} cy={[26, 34, 38, 34, 26][index]} r="4" stroke={ghost} strokeWidth="2.5" />
      ))}
    </Svg>
  ),
  necklace: (
    <Svg>
      {[16, 22, 32, 42, 48].map((x, index) => (
        <circle key={x} cx={x} cy={[20, 28, 32, 28, 20][index]} r="3" stroke={ghost} strokeWidth="2" />
      ))}
      <rect x="27" y="36" width="10" height="10" rx="2" transform="rotate(45 32 41)" fill={ghost} />
    </Svg>
  ),
  earring: (
    <Svg>
      <rect x="30" y="14" width="4" height="14" rx="2" fill={ghost} />
      <circle cx="32" cy="38" r="9" stroke={ghost} strokeWidth="3" />
    </Svg>
  ),
  mask: (
    <Svg>
      <ellipse cx="32" cy="34" rx="19" ry="24" fill={ghost} />
      <ellipse cx="25" cy="28" rx="4.5" ry="5.5" fill="#1c1a16" />
      <ellipse cx="39" cy="28" rx="4.5" ry="5.5" fill="#1c1a16" />
      <ellipse cx="32" cy="42" rx="7" ry="5" fill="#c4b6a2" />
    </Svg>
  ),
};

export const TinyShield = () => (
  <svg width="9" height="10" viewBox="0 0 12 14" fill="currentColor">
    <polygon points="6,0 12,2.5 12,8 6,14 0,8 0,2.5" />
  </svg>
);

export const TinyBullet = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" fill="currentColor">
    <rect x="5" y="5" width="4" height="8" rx="1" />
    <circle cx="7" cy="4" r="2.4" />
  </svg>
);

export const TinyWeight = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="currentColor">
    <circle cx="7" cy="4" r="2.2" />
    <polygon points="3.4,5.5 10.6,5.5 12.5,13 1.5,13" />
  </svg>
);
