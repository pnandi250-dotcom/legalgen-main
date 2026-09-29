"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F3EFE7] dark:bg-slate-950 flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            We encountered an unexpected error. Our team has been notified.
          </p>
        </div>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6 pb-8 px-6">
            {error.digest && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={reset} className="bg-orange-600 hover:bg-orange-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Go home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          If this keeps happening,{" "}
          <a href="mailto:support@legalgen.ai" className="text-orange-600 hover:underline">
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}