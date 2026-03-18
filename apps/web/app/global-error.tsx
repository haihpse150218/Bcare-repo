"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold">Đã xảy ra lỗi</h2>
            <p className="mb-4 text-neutral-600">
              Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Thử lại
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
