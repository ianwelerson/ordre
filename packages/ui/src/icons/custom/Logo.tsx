import type { SVGProps } from 'react';

export default function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="100%" height="100%" fill="none" viewBox="0 0 32 32" {...props}>
      <rect width="30" height="30" x="1" y="1" fill="#fafaf8" stroke="#1a1d26" rx="8" />
      <circle cx="16" cy="16" r="7" stroke="#1a1d26" />
      <path stroke="#e0913e" d="m12.5 16 2.4 2.4L20 13" />
    </svg>
  );
}
