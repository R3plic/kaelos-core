import type { SVGProps } from 'react'

const base = (props: SVGProps<SVGSVGElement>) => ({
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: 'false' as const,
  ...props,
})

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M3.8 10.4 12 3.6l8.2 6.8" />
      <path d="M5.6 9.3v9.2a1.4 1.4 0 0 0 1.4 1.4h10a1.4 1.4 0 0 0 1.4-1.4V9.3" />
      <path d="M9.8 19.9v-4.6h4.4v4.6" />
    </svg>
  )
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.6 15.6 4.2 4.2" />
    </svg>
  )
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 20.1S3.9 15.3 3.9 9.7a4.5 4.5 0 0 1 8.1-2.6 4.5 4.5 0 0 1 8.1 2.6c0 5.6-8.1 10.4-8.1 10.4Z" />
    </svg>
  )
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.9 20.1a7.4 7.4 0 0 1 14.2 0" />
    </svg>
  )
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6.1 9.5a5.9 5.9 0 0 1 11.8 0c0 4.3 1.5 5.8 1.5 5.8H4.6s1.5-1.5 1.5-5.8Z" />
      <path d="M10.1 18.6a2.1 2.1 0 0 0 3.8 0" />
    </svg>
  )
}

export function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6.5 4.6a1.4 1.4 0 0 1 1.4-1.4h8.2a1.4 1.4 0 0 1 1.4 1.4v15.1L12 16.2l-5.5 3.5Z" />
    </svg>
  )
}

export function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5Z" />
    </svg>
  )
}

export function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5c.7 4.4 2.1 5.8 6.5 6.5-4.4.7-5.8 2.1-6.5 6.5-.7-4.4-2.1-5.8-6.5-6.5 4.4-.7 5.8-2.1 6.5-6.5Z" />
      <path d="M18.5 15.4c.3 1.9.9 2.5 2.8 2.8-1.9.3-2.5.9-2.8 2.8-.3-1.9-.9-2.5-2.8-2.8 1.9-.3 2.5-.9 2.8-2.8Z" />
    </svg>
  )
}

export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="3.8" y="3.8" width="6.4" height="6.4" rx="1.6" />
      <rect x="13.8" y="3.8" width="6.4" height="6.4" rx="1.6" />
      <rect x="3.8" y="13.8" width="6.4" height="6.4" rx="1.6" />
      <rect x="13.8" y="13.8" width="6.4" height="6.4" rx="1.6" />
    </svg>
  )
}
