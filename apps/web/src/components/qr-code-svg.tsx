'use client';

import { encodeQrMatrix } from '@smash-bill/shared';
import { useMemo } from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  label?: string;
  className?: string;
}

export function QrCodeSvg({ value, size = 200, label = 'Mã QR', className = '' }: QrCodeSvgProps) {
  const { pathData, totalSize } = useMemo(() => {
    const matrix = encodeQrMatrix(value || 'https://smashbill.vn');
    const moduleCount = matrix.length;
    const margin = 2;
    const total = moduleCount + margin * 2;
    const segments: string[] = [];

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (matrix[r]?.[c]) {
          segments.push(`M${c + margin},${r + margin}h1v1h-1z`);
        }
      }
    }

    return {
      pathData: segments.join(''),
      totalSize: total,
    };
  }, [value]);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-tile border border-border bg-white p-3 shadow-tile ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        role="img"
        aria-label={label}
        className="h-auto max-w-full"
      >
        <title>{label}</title>
        <rect width="100%" height="100%" fill="#FFFFFF" />
        <path d={pathData} fill="#0F172A" />
      </svg>
    </div>
  );
}
