"use client";

import Link from "next/link";
import { Home, Search, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F3EFE7] dark:bg-slate-950 flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            404
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
            Page not found
          </p>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6 pb-8 px-6">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button variant="outline" asChild>
                <Link href="/compliance">
                  <Shield className="w-4 h-4 mr-2" />
                  Scan Website
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/generate">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Docs
                </Link>
              </Button>
            </div>
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>

        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Think this is a mistake?{" "}
          <a href="mailto:support@legalgen.ai" className="text-orange-600 hover:underline">
            Let us know
          </a>
        </p>
      </div>
    </div>
  );
}