import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

const common = (size: number, strokeWidth: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export function Instagram({ size = 16, strokeWidth = 1.5, ...rest }: Props) {
  return (
    <svg {...common(size, strokeWidth)} {...rest}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function Linkedin({ size = 16, strokeWidth = 1.5, ...rest }: Props) {
  return (
    <svg {...common(size, strokeWidth)} {...rest}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
