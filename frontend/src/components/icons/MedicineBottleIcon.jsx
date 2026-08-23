/** Custom app logo mark — a medicine bottle with a cross label, drawn in the
 * same stroke style as the Heroicons outline set already used elsewhere
 * (24x24 viewBox, currentColor stroke, rounded caps/joins) so it sits
 * naturally next to them. */
export default function MedicineBottleIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M9 2h6" />
      <path d="M9 2v3.5a2 2 0 0 1-.6 1.4L7 8.3A3 3 0 0 0 6 10.5V19a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-8.5a3 3 0 0 0-1-2.2l-1.4-1.4A2 2 0 0 1 15 5.5V2" />
      <path d="M6 13h12" />
      <path d="M12 15.5v3" />
      <path d="M10.5 17h3" />
    </svg>
  );
}
