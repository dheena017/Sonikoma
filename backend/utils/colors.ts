/**
 * backend/utils/colors.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ANSI terminal color formatting utility for backend logs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",

  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  // Bright foreground
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
};

export const col = {
  reset: c.reset,
  bold: (s: string) => `${c.bold}${s}${c.reset}`,
  dim: (s: string) => `${c.dim}${s}${c.reset}`,

  cyan: (s: string) => `${c.cyan}${s}${c.reset}`,
  brightCyan: (s: string) => `${c.brightCyan}${s}${c.reset}`,
  brightBlue: (s: string) => `${c.brightBlue}${s}${c.reset}`,
  brightGreen: (s: string) => `${c.brightGreen}${s}${c.reset}`,
  brightYellow: (s: string) => `${c.brightYellow}${s}${c.reset}`,
  brightMagenta: (s: string) => `${c.brightMagenta}${s}${c.reset}`,
  brightRed: (s: string) => `${c.brightRed}${s}${c.reset}`,
  gray: (s: string) => `${c.gray}${s}${c.reset}`,

  // Shorthand severity level/log category coloring
  info: (s: string) => `${c.bold}${c.brightCyan}${s}${c.reset}`,
  success: (s: string) => `${c.bold}${c.brightGreen}${s}${c.reset}`,
  warn: (s: string) => `${c.bold}${c.brightYellow}${s}${c.reset}`,
  error: (s: string) => `${c.bold}${c.brightRed}${s}${c.reset}`,
  label: (s: string) => `${c.bold}${c.brightMagenta}${s}${c.reset}`,
};
