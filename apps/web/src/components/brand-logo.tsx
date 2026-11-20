interface BrandLogoProps {
  alt?: string;
  size?: number;
  className?: string;
}

export function BrandLogo({
  alt = 'SmashBill Logo',
  size = 40,
  className = 'h-full w-full object-contain',
}: BrandLogoProps) {
  return (
    <>
      <img
        src="/logo.jpg"
        alt={alt}
        width={size}
        height={size}
        className={`${className} block rounded-md dark:hidden`}
      />
      <img
        src="/logo_dark.jpg"
        alt={alt}
        width={size}
        height={size}
        className={`${className} hidden rounded-md dark:block`}
      />
    </>
  );
}
