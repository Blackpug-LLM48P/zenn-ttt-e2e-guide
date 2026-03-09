/**
 * TTT & TTT-E2E サンプル実装
 * Zenn記事「【2026決定版】TTT & TTT-E2E 日本語最深解説」付属テンプレート
 */

export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("ゼロ除算は許可されていません");
  }
  return a / b;
}
