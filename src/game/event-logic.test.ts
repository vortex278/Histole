import { getYearDirection } from "@/game/event-logic";

describe("getYearDirection", () => {
  it("points up when the target year is greater than the guess", () => {
    expect(getYearDirection("1849", "1863")).toBe("up");
  });

  it("points down when the target year is less than the guess", () => {
    expect(getYearDirection("1863", "1849")).toBe("down");
  });

  it("does not point when the years match or are invalid", () => {
    expect(getYearDirection("1849", "1849")).toBeNull();
    expect(getYearDirection("unknown", "1849")).toBeNull();
  });
});
