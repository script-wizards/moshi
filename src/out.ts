export function wantsJson(args: string[]): boolean {
  return args.includes("--json") || args.includes("-j");
}

export function emit(args: string[], data: unknown, text: string): void {
  console.log(wantsJson(args) ? JSON.stringify(data, null, 2) : text);
}

export function modTag(mod: number): string {
  return mod > 0 ? " [+]" : mod < 0 ? " [-]" : "";
}

export function localTime(iso: string, withDate = false): string {
  const d = new Date(iso);
  const hm = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  return withDate ? `${d.toLocaleDateString("en-CA")} ${hm}` : hm;
}
