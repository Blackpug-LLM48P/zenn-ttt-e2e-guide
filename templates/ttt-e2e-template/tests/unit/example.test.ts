import { add, subtract, multiply, divide } from "../../src/example";

describe("四則演算", () => {
  describe("add()", () => {
    it("正の数を足し合わせる", () => {
      expect(add(2, 3)).toBe(5);
    });

    it("負の数を含む加算", () => {
      expect(add(-1, 1)).toBe(0);
    });
  });

  describe("subtract()", () => {
    it("大きい数から小さい数を引く", () => {
      expect(subtract(5, 3)).toBe(2);
    });
  });

  describe("multiply()", () => {
    it("2つの数を掛け算する", () => {
      expect(multiply(3, 4)).toBe(12);
    });

    it("0との掛け算は0になる", () => {
      expect(multiply(5, 0)).toBe(0);
    });
  });

  describe("divide()", () => {
    it("2つの数を割り算する", () => {
      expect(divide(10, 2)).toBe(5);
    });

    it("ゼロ除算はエラーを投げる", () => {
      expect(() => divide(10, 0)).toThrow("ゼロ除算は許可されていません");
    });
  });
});
