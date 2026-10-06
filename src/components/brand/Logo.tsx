type LogoProps = {
  className?: string
}

/** Logotipo horizontal de DentalMaster: isotipo y nombre. */
export function Logo({ className = "h-12" }: LogoProps) {
  return (
    <img
      src="/marca/dentalmaster-horizontal.png"
      alt="DentalMaster"
      className={`w-auto ${className}`}
    />
  )
}
