const add: (...numbers: number[]) => number = (
  ...numbers: number[]
): number => {
  let sum: number = 0;
  numbers.forEach((n: number) => (sum = sum + n));

  return sum;
};

describe("add", () => {
  test("1 + 1 = 2", () => {
    expect(add(1, 1)).toBe(2);
  });
  test("2 + 3 + 19 = 24", () => {
    expect(add(2, 3, 19)).toBe(24);
  });
});
