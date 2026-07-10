type FormHoneypotProps = {
  name?: string;
};

export function FormHoneypot({ name = "_gotcha" }: FormHoneypotProps) {
  return (
    <input
      type="text"
      name={name}
      tabIndex={-1}
      autoComplete="off"
      className="pointer-events-none absolute left-[-9999px] h-px w-px opacity-0"
      aria-hidden="true"
    />
  );
}
