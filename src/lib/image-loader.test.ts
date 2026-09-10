import { describe, expect, it } from "vitest";
import { buildWsrvUrl, motoStageImageLoader } from "@/lib/image-loader";

describe("image-loader", () => {
  it("proxies shop uploads to wsrv", () => {
    expect(
      buildWsrvUrl("https://shop.motorock.eu/wp-content/uploads/bike.jpg", 640),
    ).toBe(
      "https://wsrv.nl/?url=shop.motorock.eu%2Fwp-content%2Fuploads%2Fbike.jpg&w=640&q=75&output=webp",
    );
  });

  it("fills moto stage PNG transparency at the CDN", () => {
    expect(
      buildWsrvUrl(
        "https://shop.motorock.eu/wp-content/uploads/bike.png",
        640,
        75,
        { stageBackground: "moto" },
      ),
    ).toContain("bg=c8c8c8");
    expect(
      motoStageImageLoader({
        src: "https://shop.motorock.eu/wp-content/uploads/bike.png",
        width: 640,
      }),
    ).toContain("bg=c8c8c8");
  });

  it("returns local assets unchanged", () => {
    expect(buildWsrvUrl("/logo.png", 128)).toBe("/logo.png");
  });
});
