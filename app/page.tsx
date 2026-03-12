"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, ArrowRight, MessageCircle, Link2 } from "lucide-react";
import { getBlendByName, createBlend, getBlendByCodeOrAlias } from "@/lib/mock-db";
import { toast } from "sonner";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function HomePage() {
  const router = useRouter();
  const [tripName, setTripName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ link: string } | null>(null);

  const handleCreateTrip = async (forceCreate = false) => {
    if (!tripName.trim()) {
      toast.error("Please enter your group chat name");
      return;
    }

    setIsCreating(true);

    try {
      // Check if a trip with this exact name already exists (only if not forcing)
      if (!forceCreate) {
        const existingTrip = getBlendByName(tripName.trim());

        if (existingTrip) {
          // Trip with this name already exists - show warning
          const tripLink = existingTrip.alias || existingTrip.invite_code;
          setDuplicateWarning({ link: tripLink });
          setIsCreating(false);
          return;
        }
      }

      // Create new trip
      const code = generateInviteCode();

      createBlend({ name: tripName.trim(), invite_code: code });

      toast.success("Trip created!");
      setDuplicateWarning(null);
      router.push(`/trip/${code}`);
    } catch (error) {
      console.error("Error creating trip:", error);
      toast.error("Failed to create trip. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTrip = async () => {
    if (!inviteCode.trim()) {
      toast.error("Please enter an invite code or paste the full link");
      return;
    }

    // Extract code from full URL if pasted
    let codeToUse = inviteCode.trim();
    if (inviteCode.includes("/trip/")) {
      const match = inviteCode.match(/\/trip\/([^/?]+)/i);
      if (match) {
        codeToUse = match[1];
      }
    }

    setIsJoining(true);

    try {
      const data = getBlendByCodeOrAlias(codeToUse);

      if (!data) {
        toast.error("Trip not found. Check your invite code.");
        return;
      }

      // Use alias if available, otherwise use invite code
      const tripLink = data.alias || data.invite_code;

      router.push(`/trip/${tripLink}`);
    } catch (error) {
      console.error("Error joining trip:", error);
      toast.error("Failed to join trip. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-4">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">TripBlend</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Plan trips with friends, find the perfect destination and time for everyone
          </p>
        </div>

        {/* Create Trip */}
        <Card className="border-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-medium">What's your group chat name?</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your group chat name as the trip name. Share the link with everyone in the chat.
            </p>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Start a new trip</h2>
              <p className="text-sm text-muted-foreground">
                Create a group trip and invite your friends
              </p>
            </div>
            
            <div className="space-y-3">
              <Input
                placeholder="e.g., Squad Summer Trip"
                value={tripName}
                onChange={(e) => {
                  setTripName(e.target.value);
                  setDuplicateWarning(null);
                }}
                disabled={isCreating}
              />
              
              {duplicateWarning && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3 space-y-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    This trip may already exist. Open the link shared previously, or type in the trip code to join an existing trip.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setDuplicateWarning(null);
                        setTripName("");
                      }}
                    >
                      Go back
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCreateTrip(true)}
                      disabled={isCreating}
                    >
                      {isCreating ? "Creating..." : "Create new trip"}
                    </Button>
                  </div>
                </div>
              )}
              
              {!duplicateWarning && (
                <Button
                  className="w-full gap-2"
                  onClick={() => handleCreateTrip(false)}
                  disabled={isCreating || !tripName.trim()}
                >
                  {isCreating ? "Creating..." : "Create & Get Shareable Link"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            
          </div>
          
        </div>

        {/* Join Trip */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Join an existing trip</h2>
              <p className="text-sm text-muted-foreground">
                Enter your invite code or paste the trip link
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Paste link or enter code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="font-sans"
                onKeyDown={(e) => e.key === "Enter" && handleJoinTrip()}
              />
              <Button
                variant="outline"
                onClick={handleJoinTrip}
                disabled={isJoining || !inviteCode.trim()}
                className="bg-transparent"
              >
                {isJoining ? "..." : "Join"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/changelog" className="hover:text-foreground transition-colors underline underline-offset-2">
              What's new
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <span>Privacy: Private links only, not indexed</span>
          </div>
          <p className="max-w-md mx-auto">
            No personal info required. All trip preferences are visible to anyone with the link. Don't share sensitive information.
          </p>
        </div>
      </div>
    </main>
  );
}
