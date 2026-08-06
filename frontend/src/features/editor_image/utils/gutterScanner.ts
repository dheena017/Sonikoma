/**
 * Scans an image to detect horizontal whitespace gutters or gaps.
 */
export async function detectHorizontalGutters(
  imageUrl: string,
  tolerance: number = 15,
  minGutterHeight: number = 2
): Promise<{ gutters: number[]; naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      try {
        const canvas = document.createElement("canvas");
        const scanHeight = Math.min(1200, naturalHeight);
        canvas.width = 40;
        canvas.height = scanHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ gutters: [], naturalWidth, naturalHeight });
          return;
        }
        ctx.drawImage(img, 0, 0, 40, scanHeight);
        const imgData = ctx.getImageData(0, 0, 40, scanHeight).data;

        // Sample background color from top-left pixel
        const bgR = imgData[0];
        const bgG = imgData[1];
        const bgB = imgData[2];

        const isGutterRow: boolean[] = [];

        for (let y = 0; y < scanHeight; y++) {
          let rowMatch = true;
          for (let x = 0; x < 40; x++) {
            const idx = (y * 40 + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];

            const dist = Math.sqrt(
              (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
            );

            if (dist > tolerance) {
              rowMatch = false;
              break;
            }
          }
          isGutterRow.push(rowMatch);
        }

        const gutters: number[] = [];
        let inGutter = false;
        let startRow = 0;

        for (let y = 0; y < scanHeight; y++) {
          if (isGutterRow[y]) {
            if (!inGutter) {
              inGutter = true;
              startRow = y;
            }
          } else {
            if (inGutter) {
              inGutter = false;
              const endRow = y - 1;
              if (endRow - startRow >= minGutterHeight) {
                const center = (startRow + endRow) / 2;
                const pct = parseFloat(
                  ((center / scanHeight) * 100).toFixed(1)
                );
                if (pct >= 5 && pct <= 95) {
                  gutters.push(pct);
                }
              }
            }
          }
        }

        if (inGutter && scanHeight - 1 - startRow >= minGutterHeight) {
          const center = (startRow + scanHeight - 1) / 2;
          const pct = parseFloat(((center / scanHeight) * 100).toFixed(1));
          if (pct >= 5 && pct <= 95) {
            gutters.push(pct);
          }
        }

        resolve({ gutters, naturalWidth, naturalHeight });
      } catch (err) {
        console.warn(
          "Gutter detection failed (Canvas CORS or loading issue):",
          err
        );
        resolve({ gutters: [], naturalWidth, naturalHeight });
      }
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
}
