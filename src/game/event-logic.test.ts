import { EventCard, findEventByName, getStateDirection, getYearDirection } from "@/game/event-logic";

const TEST_EVENTS: EventCard[] = [
  {
    eventId: 1,
    name: "Pennsylvania Colony Established",
    image: "",
    year: "1681",
    state: "Pennsylvania",
    era: "Colonial Era",
    scale: "International",
    tag: "Migration",
  },
];

describe("findEventByName", () => {
  it("finds a catalog event using a case-insensitive exact name", () => {
    expect(findEventByName(TEST_EVENTS, " pennsylvania colony established ")?.eventId).toBe(1);
  });

  it("returns undefined for an event that is not in the catalog", () => {
    expect(findEventByName(TEST_EVENTS, "Not a historical event")).toBeUndefined();
  });
});

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

describe("getStateDirection", () => {
  it("points right or left across the country", () => {
    expect(getStateDirection("California", "New York")).toBe("right");
    expect(getStateDirection("New York", "California")).toBe("left");
  });

  it("points to diagonal and cardinal target states", () => {
    expect(getStateDirection("Texas", "Minnesota")).toBe("up");
    expect(getStateDirection("Washington", "Florida")).toBe("southeast");
    expect(getStateDirection("Florida", "Alabama")).toBe("northwest");
    expect(getStateDirection("California", "Oregon")).toBe("up");
    expect(getStateDirection("Minnesota", "Texas")).toBe("down");
  });

  it("points north when Pennsylvania is the target and Florida is the guess", () => {
    expect(getStateDirection("Florida", "Pennsylvania")).toBe("up");
  });

  it("does not point when states match or are unknown", () => {
    expect(getStateDirection("Texas", "Texas")).toBeNull();
    expect(getStateDirection("Unknown", "Texas")).toBeNull();
  });
});
