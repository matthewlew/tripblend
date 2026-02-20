import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Palette, Keyboard, Globe, Shield, Zap } from "lucide-react";

export default function ChangelogPage() {
  const updates = [
    {
      version: "v1.5",
      date: "Feb 9, 2026",
      icon: Keyboard,
      color: "text-blue-600 dark:text-blue-400",
      items: [
        { title: "Keyboard navigation", description: "Press Cmd+K to focus search, Space/Enter to toggle preferences, Escape to dismiss dropdowns" },
        { title: "Dark mode polish", description: "Fixed contrast issues with badges, checkboxes, and hover states for better readability" },
        { title: "Duplicate trip detection", description: "Gentle warnings when creating trips with existing names, with option to continue or join existing" },
        { title: "Relevance badges", description: "Smart labels like 'Best Match', 'Most Popular', 'Peak Season' explain why each suggestion ranks" },
        { title: "Accessibility improvements", description: "Added ARIA labels, focus indicators, and screen reader support throughout" },
      ],
    },
    {
      version: "v1.4",
      date: "Feb 8, 2026",
      icon: Globe,
      color: "text-green-600 dark:text-green-400",
      items: [
        { title: "Multi-origin travel support", description: "Trip suggestions now consider everyone's home airport to find fairest meeting points" },
        { title: "Travel equity indicators", description: "See flight times and fairness scores for each destination based on where everyone is coming from" },
        { title: "Origin display", description: "Participant home airports shown throughout the app for better context" },
        { title: "User switching toast", description: "Clear feedback when switching between user profiles in the same trip" },
      ],
    },
    {
      version: "v1.3",
      date: "Feb 7, 2026",
      icon: Palette,
      color: "text-purple-600 dark:text-purple-400",
      items: [
        { title: "Mobile bottom tabs", description: "Improved navigation with liquid glass design for Preferences and Suggestions views" },
        { title: "Destination tag styling", description: "More neutral colors that keep focus on suggestions rather than preferences" },
        { title: "Month selection optimization", description: "Reduced vertical spacing to show more months at once on all screen sizes" },
        { title: "Card animations", description: "Smooth slide-in animations help you understand suggestion rankings as they update" },
      ],
    },
    {
      version: "v1.2",
      date: "Feb 6, 2026",
      icon: Sparkles,
      color: "text-amber-600 dark:text-amber-400",
      items: [
        { title: "Empty state guidance", description: "Contextual help messages guide new users through adding destinations and availability" },
        { title: "Contextual tooltips", description: "Help icons on section headers explain how each feature affects suggestions" },
        { title: "Suggestion count", description: "Live count in mobile tabs shows how many trips match your group's preferences" },
        { title: "Improved scoring", description: "Better algorithm balancing popularity, availability overlap, and season quality" },
      ],
    },
    {
      version: "v1.1",
      date: "Feb 5, 2026",
      icon: Shield,
      color: "text-red-600 dark:text-red-400",
      items: [
        { title: "Custom trip aliases", description: "Create memorable URLs like /trip/bali-squad instead of random codes" },
        { title: "Alias conflict detection", description: "Prevents duplicate custom URLs and redirects old codes to new aliases" },
        { title: "Join by alias or code", description: "Works with both custom aliases and original invite codes when joining trips" },
        { title: "URL auto-update", description: "Browser URL reflects custom alias after saving for easier bookmarking" },
      ],
    },
    {
      version: "v1.0",
      date: "Feb 4, 2026",
      icon: Zap,
      color: "text-indigo-600 dark:text-indigo-400",
      items: [
        { title: "Core trip planning", description: "Create trips, invite friends, vote on destinations and availability" },
        { title: "Smart suggestions", description: "Automatic recommendations based on group preferences and seasonal data" },
        { title: "Season awareness", description: "Peak, Shoulder, and Off-Season indicators for each destination" },
        { title: "Persistent profiles", description: "Your preferences saved across sessions with localStorage" },
        { title: "Home airport support", description: "Link directly to Google Flights from any suggestion" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">What's new in TripBlend</h1>
          <p className="text-muted-foreground">
            Recent updates and improvements to help you plan better trips with friends
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {updates.map((update, index) => {
            const Icon = update.icon;
            return (
              <div key={update.version} className="relative">
                {/* Timeline line */}
                {index < updates.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-border" />
                )}
                
                {/* Update card */}
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center ${update.color} relative z-10`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="flex items-baseline gap-3 mb-3">
                      <h2 className="text-xl font-semibold">{update.version}</h2>
                      <span className="text-sm text-muted-foreground">{update.date}</span>
                    </div>
                    
                    <ul className="space-y-2">
                      {update.items.map((item, i) => (
                        <li key={i} className="text-sm">
                          <span className="font-medium text-foreground">{item.title}</span>
                          <span className="text-muted-foreground"> — {item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Have feedback or feature requests?
          </p>
          <Link href="/">
            <Button>Start planning a trip</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
