import Image from "next/image";

interface LogoProps {
  /** Rendered height in px; width follows the logo's aspect ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
}

const LOGO_WIDTH = 1120;
const LOGO_HEIGHT = 476;

export default function Logo({
  height = 40,
  className = "",
  priority = false,
}: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Gomti Infra and Mining Pvt Ltd"
      width={Math.round((height * LOGO_WIDTH) / LOGO_HEIGHT)}
      height={height}
      priority={priority}
      className={`h-auto w-auto shrink-0 ${className}`}
      style={{ height }}
    />
  );
}
