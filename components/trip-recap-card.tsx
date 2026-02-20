"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy, Check } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import type { CityData } from "@/lib/cities-data";

type RecapData = {
  tripName: string;
  participantCount: number;
  topDestination?: { dest: CityData; month: string; voters: number };
  secondDestination?: { dest: CityData; month: string; voters: number };
  thirdDestination?: { dest: CityData; month: string; voters: number };
  vibe: string;
  shareUrl: string;
};

export function TripRecapCard({ data }: { data: RecapData }) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.tripName} - TripBlend`,
          text: `We're planning ${data.tripName}! Check out where we're going.`,
          url: data.shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      // Use html2canvas if available, otherwise prompt to screenshot
      toast.info("Take a screenshot to share! (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)");
    } catch (err) {
      toast.error("Screenshot not available - please capture manually");
    }
  };

  return (
    <div className="space-y-4">
      <Card
        ref={cardRef}
        className="p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-2"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
              <span>{data.participantCount} {data.participantCount === 1 ? 'person' : 'people'} planning</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{data.tripName}</h2>
            <p className="text-sm text-muted-foreground">{data.vibe}</p>
          </div>

          {/* Top Destinations */}
          <div className="space-y-3">
            {data.topDestination && (
              <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">🏆</span>
                      <span className="font-semibold text-lg">{data.topDestination.dest.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {data.topDestination.month} • {data.topDestination.voters} {data.topDestination.voters === 1 ? 'vote' : 'votes'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.secondDestination && (
              <div className="bg-muted/50 rounded-lg p-3 border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg">🥈</span>
                      <span className="font-medium">{data.secondDestination.dest.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {data.secondDestination.month} • {data.secondDestination.voters} {data.secondDestination.voters === 1 ? 'vote' : 'votes'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.thirdDestination && (
              <div className="bg-muted/30 rounded-lg p-3 border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg">🥉</span>
                      <span className="font-medium">{data.thirdDestination.dest.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {data.thirdDestination.month} • {data.thirdDestination.voters} {data.thirdDestination.voters === 1 ? 'vote' : 'votes'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Plan your next trip at <span className="font-mono font-semibold">TripBlend</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleShare} className="flex-1 gap-2" variant="secondary">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button onClick={handleCopy} className="flex-1 gap-2 bg-transparent" variant="outline">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy link"}
        </Button>
        <Button onClick={handleDownload} className="gap-2 bg-transparent" variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
