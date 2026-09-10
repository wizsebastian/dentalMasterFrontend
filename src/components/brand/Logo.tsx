import { ToothMark } from "./ToothMark"

/** Logotipo de la aplicación: la marca más el nombre. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-marca text-esmalte">
        <ToothMark variant="solid" className="h-5 w-5" title="DentalMaster" />
      </span>
      <span className="text-[17px] font-semibold tracking-tight text-tinta">
        Dental<span className="font-normal text-tinta-suave">Master</span>
      </span>
    </span>
  )
}
