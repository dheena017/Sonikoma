import { useState } from "react";

export const useFontUploader = () => {
  const [uploadedFonts, setUploadedFonts] = useState<string[]>([]);

  const handleFontUpload = (file: File) => {
    const fontName = file.name.replace(/\.[^/.]+$/, "");
    const fontUrl = URL.createObjectURL(file);

    const newStyle = document.createElement("style");
    newStyle.appendChild(
      document.createTextNode(`
        @font-face {
          font-family: '${fontName}';
          src: url('${fontUrl}');
        }
      `)
    );
    document.head.appendChild(newStyle);
    setUploadedFonts((prev) => [...prev, fontName]);
    return fontName;
  };

  return {
    uploadedFonts,
    handleFontUpload,
  };
};
