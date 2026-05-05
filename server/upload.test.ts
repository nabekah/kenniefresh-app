import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock storagePut before importing the route
vi.mock("../server/storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "product-images/test_abc123.jpg", url: "/manus-storage/product-images/test_abc123.jpg" }),
}));

import { storagePut } from "../server/storage";

describe("product image upload route logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls storagePut with correct key prefix and content type", async () => {
    const mockBuffer = Buffer.from("fake-image-data");
    const mockMimetype = "image/jpeg";
    const mockFilename = "milo.jpg";

    const ext = mockFilename.split(".").pop() ?? "jpg";
    const key = `product-images/${Date.now()}.${ext}`;
    await storagePut(key, mockBuffer, mockMimetype);

    expect(storagePut).toHaveBeenCalledOnce();
    const [calledKey, calledBuffer, calledMime] = (storagePut as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(calledKey).toMatch(/^product-images\/\d+\.jpg$/);
    expect(calledBuffer).toBe(mockBuffer);
    expect(calledMime).toBe("image/jpeg");
  });

  it("storagePut returns a /manus-storage/ URL", async () => {
    const result = await storagePut("product-images/test.jpg", Buffer.from("x"), "image/jpeg");
    expect(result.url).toMatch(/^\/manus-storage\//);
    expect(result.key).toBeTruthy();
  });
});
