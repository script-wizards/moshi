export function wantsJson(args: string[]): boolean {
  return args.includes("--json") || args.includes("-j");
}

export function emit(args: string[], data: unknown, text: string): void {
  console.log(wantsJson(args) ? JSON.stringify(data, null, 2) : text);
}

export function modTag(mod: number): string {
  return mod > 0 ? " [+]" : mod < 0 ? " [-]" : "";
}
