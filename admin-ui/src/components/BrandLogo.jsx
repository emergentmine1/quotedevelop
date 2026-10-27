import { useState } from 'react';

const LOGO_SRC = new URL('../../public/Kwe-logo.png', import.meta.url).href;

export default function BrandLogo({
  className = 'h-10 w-auto',
  alt = 'KWE Global Logistics Partner',
}) {
  const [src] = useState(LOGO_SRC);

  return <img src={src} alt={alt} className={className} draggable={false} />;
}

