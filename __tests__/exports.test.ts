jest.mock("expo-file-system", () => ({ cacheDirectory: "file://cache/", writeAsStringAsync: jest.fn() }));
jest.mock("expo-print", () => ({ printToFileAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { shareExport } from "../src/exports";

const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
const mockPrint = Print as jest.Mocked<typeof Print>;
const mockSharing = Sharing as jest.Mocked<typeof Sharing>;

const event = { name: "Race / 50K", date: "Oct 10", distance: "50 km", targetTime: "6:00", elevation: "2,000 m", pace: "7:12" };
const workouts = [{ id: "mon", date: "MON · AUG 17", title: "Easy", detail: "Rest\nRecover", duration: "30 min", type: "run" as const }];

describe("plan exports", () => {
  beforeEach(() => { jest.clearAllMocks(); mockSharing.isAvailableAsync.mockResolvedValue(true); });

  it("writes and shares a safely named Markdown export", async () => {
    await shareExport("md", event, workouts);
    expect(mockFileSystem.writeAsStringAsync).toHaveBeenCalledWith("file://cache/Race - 50K-training-plan.md", expect.stringContaining("# Race / 50K Training Plan"));
    expect(mockSharing.shareAsync).toHaveBeenCalledWith("file://cache/Race - 50K-training-plan.md", { mimeType: undefined });
  });

  it("writes an iCalendar export with a calendar MIME type", async () => {
    await shareExport("ics", event, workouts);
    expect(mockFileSystem.writeAsStringAsync).toHaveBeenCalledWith(expect.stringContaining(".ics"), expect.stringContaining("BEGIN:VCALENDAR"));
    expect(mockSharing.shareAsync).toHaveBeenCalledWith(expect.stringContaining(".ics"), { mimeType: "text/calendar" });
  });

  it("creates a PDF and does not share when unavailable", async () => {
    mockPrint.printToFileAsync.mockResolvedValue({ uri: "file://plan.pdf" } as any);
    mockSharing.isAvailableAsync.mockResolvedValue(false);
    await shareExport("pdf", event, workouts);
    expect(mockPrint.printToFileAsync).toHaveBeenCalledWith(expect.objectContaining({ html: expect.stringContaining("Race / 50K") }));
    expect(mockSharing.shareAsync).not.toHaveBeenCalled();
  });
});
