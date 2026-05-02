interface IconProps {
  className?: string;
  title?: string;
}

export const TelegramIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export const YouTubeIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const InstagramIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);
export const FacebookIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.325 24H12.82v-9.294H9.692V11.41h3.128V8.708c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.464.099 2.797.143v3.24l-1.922.001c-1.508 0-1.799.717-1.799 1.767v2.317h3.596l-.468 3.296h-3.128V24h6.128C23.407 24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.675 0z" />
  </svg>
);
export const CryingIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    {/* Обличчя */}
    <circle cx="16" cy="16" r="14" stroke="gray" strokeWidth="2" fill="none" />
    {/* Очі */}
    <circle cx="11" cy="12" r="1.5" fill="gray" />
    <circle cx="21" cy="12" r="1.5" fill="gray" />
    {/* Рот */}
    <path d="M11 22 Q16 18 21 22" stroke="gray" strokeWidth="2" fill="none" />
    {/* Сльози */}
    <ellipse cx="10" cy="16" rx="1.2" ry="2.5" fill="#00BFFF" />
    <ellipse cx="22" cy="16" rx="1.2" ry="2.5" fill="#00BFFF" />
  </svg>
);

export const SadIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" stroke="gray" strokeWidth="2" fill="none" />
    <circle cx="11" cy="12" r="1.5" fill="gray" />
    <circle cx="21" cy="12" r="1.5" fill="gray" />
    <path d="M11 22 Q16 17 21 22" stroke="gray" strokeWidth="2" fill="none" />
  </svg>
);

export const HappyIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" stroke="gray" strokeWidth="2" fill="none" />
    <circle cx="11" cy="12" r="1.5" fill="gray" />
    <circle cx="21" cy="12" r="1.5" fill="gray" />
    <path d="M11 20 Q16 24 21 20" stroke="gray" strokeWidth="2" fill="none" />
  </svg>
);

export const StarEyesIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" stroke="gray" strokeWidth="2" fill="none" />
    {/* Зірочки */}
    <polygon
      points="11,11 12,14 15,14 12.5,16 13.5,19 11,17 8.5,19 9.5,16 7,14 10,14"
      fill="orange"
    />
    <polygon
      points="21,11 22,14 25,14 22.5,16 23.5,19 21,17 18.5,19 19.5,16 17,14 20,14"
      fill="orange"
    />
    {/* Усмішка */}
    <path d="M11 21 Q16 26 21 21" stroke="gray" strokeWidth="2" fill="none" />
  </svg>
);
