import React from "react";

export default function AuthFooter() {
  return (
    <div className="flex lg:hidden text-center justify-center mt-8 text-[10px] text-neutral-600 font-semibold">
      © {new Date().getFullYear()} Sonikoma AI Corp. All rights reserved.
    </div>
  );
}
