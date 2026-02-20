"use client";

import { DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Plane, X, Search, Check, Calendar, MapPin, Users, Clock, Share2, ExternalLink, ChevronDown, Pencil, Trash2, Navigation, PlaneTakeoffIcon, HelpCircle, Sparkles } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "sonner";
import { 
  CITIES, 
  AIRPORTS, 
  searchCities, 
  searchAirports, 
  getGoogleFlightsUrl, 
  getAvatarGradient,
  getSeasonLabel,
  type CityData,
  isVisaFreeForUS
} from "@/lib/cities-data";
import { cn } from "@/lib/utils";
import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { TripRecapCard } from "@/components/trip-recap-card";

interface Participant {
  id: string;
  name: string;
  home_airport: string | null;
  created_at: string;
}

interface AvailabilityVote {
  participant_id: string;
  year_month: string;
}

interface DestinationPick {
  id: string;
  participant_id: string;
  destination_key: string;
  destination_data: CityData | null;
}

interface AvoidedDestination {
  id: string;
  participant_id: string;
  destination_key: string;
  destination_data: CityData | null;
}

interface TripData {
  id: string;
  name: string;
  invite_code: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getNext12Months(): { key: string; label: string; month: number; year: number }[] {
  const months = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  for (let i = 0; i < 16; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    // Only show year if it's next year (not current year)
    const label = year > currentYear 
      ? `${MONTHS[date.getMonth()]} ${year}`
      : MONTHS[date.getMonth()];
    months.push({
      key: `${year}-${month.toString().padStart(2, "0")}`,
      label,
      month,
      year,
    });
  }
  return months;
}

function getStoredProfile(tripCode: string): { id: string; name: string; homeAirport?: string } | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(`tripblend_profile_${tripCode}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

function setStoredProfile(tripCode: string, profile: { id: string; name: string; homeAirport?: string }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`tripblend_profile_${tripCode}`, JSON.stringify(profile));
}

function removeStoredProfile(tripCode: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`tripblend_profile_${tripCode}`);
}

// Avatar component with gradient
function Avatar({ name, size = "md" }: { name: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const gradient = getAvatarGradient(name);
  const sizeClasses = {
    xs: "h-5 w-5 text-[10px]",
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };
  
  return (
    <div className={cn(
      "rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white shadow-sm",
      gradient,
      sizeClasses[size]
    )}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function TripPage() {
  const params = useParams();
  const code = params.code as string;
  const supabase = createClient();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Focus destination search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setMobileTab("preferences");
      }
      // Escape: Dismiss open dropdowns
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowAvoidSearch(false);
        setShowAirportDropdown(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Initialize theme on mount and listen for system changes
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    const themeToUse = savedTheme || "system";
    setTheme(themeToUse);
    
    const applyTheme = (theme: "light" | "dark" | "system") => {
      if (theme === "system") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", isDark);
      } else {
        document.documentElement.classList.toggle("dark", theme === "dark");
      }
    };
    
    applyTheme(themeToUse);
    
    // Listen for system theme changes when in auto mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const currentTheme = localStorage.getItem("theme") || "system";
      if (currentTheme === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const [trip, setTrip] = useState<TripData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availability, setAvailability] = useState<AvailabilityVote[]>([]);
  const [destinations, setDestinations] = useState<DestinationPick[]>([]);
  const [avoidedDestinations, setAvoidedDestinations] = useState<AvoidedDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User state
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [existingProfile, setExistingProfile] = useState<{ id: string; name: string; homeAirport?: string } | null>(null);

  // Edit profile state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [mobileTab, setMobileTab] = useState<"preferences" | "suggestions">("preferences");
  
  // Add person state
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [isCreatingPerson, setIsCreatingPerson] = useState(false);
  
  // Edit trip name state
  const [isEditingTripName, setIsEditingTripName] = useState(false);
  const [editTripNameValue, setEditTripNameValue] = useState("");
  const [isSavingTripName, setIsSavingTripName] = useState(false);
  
  // Share with alias state
  const [showAliasDialog, setShowAliasDialog] = useState(false);
  const [aliasValue, setAliasValue] = useState("");
  const [isSavingAlias, setIsSavingAlias] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  
  // Recap card state
  const [showRecapDialog, setShowRecapDialog] = useState(false);

  // Home airport state
  const [homeAirport, setHomeAirport] = useState("");
  const [airportSearch, setAirportSearch] = useState("");
  const [airportResults, setAirportResults] = useState<{ code: string; name: string; city: string }[]>([]);
  const [showAirportDropdown, setShowAirportDropdown] = useState(false);
  const [selectedAirportIndex, setSelectedAirportIndex] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityData[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Avoid search state
  const [avoidSearchQuery, setAvoidSearchQuery] = useState("");
  const [avoidSearchResults, setAvoidSearchResults] = useState<CityData[]>([]);
  const [showAvoidSearch, setShowAvoidSearch] = useState(false);
  const [avoidSelectedIndex, setAvoidSelectedIndex] = useState(0);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Visa Free Filter State
  const [showVisaFreeOnly, setShowVisaFreeOnly] = useState(false);

  const months = getNext12Months();

  const fetchTripData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Database not configured. Please connect Supabase in v0 settings.");
      setLoading(false);
      return;
    }

    try {
      // Try to find trip by invite_code or alias
      const { data: tripData, error: tripError } = await supabase
        .from("blends")
        .select("*")
        .or(`invite_code.eq.${code},alias.eq.${code}`)
        .single();

      if (tripError || !tripData) {
        setError("Trip not found");
        setLoading(false);
        return;
      }

      setTrip(tripData);

      const { data: participantsData } = await supabase
        .from("participants")
        .select("*")
        .eq("blend_id", tripData.id)
        .order("created_at", { ascending: true });

      setParticipants(participantsData || []);

      const { data: availData } = await supabase
        .from("availability")
        .select("participant_id, year_month")
        .in("participant_id", (participantsData || []).map((p) => p.id));

      setAvailability(availData || []);

      const { data: destData } = await supabase
        .from("destinations")
        .select("id, participant_id, destination_key, destination_data")
        .in("participant_id", (participantsData || []).map((p) => p.id));

      setDestinations(destData || []);
      
      const { data: avoidedData } = await supabase
        .from("avoided_destinations")
        .select("id, participant_id, destination_key, destination_data")
        .in("participant_id", (participantsData || []).map((p) => p.id));

      setAvoidedDestinations(avoidedData || []);

      // Check for existing profile
      const storedProfile = getStoredProfile(code);
      if (storedProfile) {
        const participant = (participantsData || []).find((p) => p.id === storedProfile.id);
        if (participant) {
          const profile = {
            id: storedProfile.id,
            name: storedProfile.name,
            homeAirport: participant.home_airport || storedProfile.homeAirport,
          };
          setExistingProfile(profile);
          // Auto-load user session if they have an existing profile
          setCurrentUserId(profile.id);
          setUserName(profile.name);
          setHomeAirport(profile.homeAirport || "");
          // Set airport search display if home airport exists
          try {
            if (profile.homeAirport && AIRPORTS) {
              const airport = AIRPORTS.find(a => a.code === profile.homeAirport);
              if (airport) {
                setAirportSearch(`${airport.city} (${airport.code})`);
              }
            }
          } catch (e) {
            console.error("[v0] Error loading airport display:", e);
          }
          setHasJoined(true);
        } else {
          removeStoredProfile(code);
        }
      }
    } catch (err) {
      console.error("Error fetching trip:", err);
      setError("Failed to load trip");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchTripData();
  }, [fetchTripData]);

  // Search destinations
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const results = searchCities(searchQuery, 8);
      setSearchResults(results);
      setSelectedIndex(0);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Search airports
  useEffect(() => {
    if (airportSearch.length >= 2) {
      const results = searchAirports(airportSearch, 6);
      setAirportResults(results);
      setShowAirportDropdown(results.length > 0);
      setSelectedAirportIndex(0);
    } else {
      setAirportResults([]);
      setShowAirportDropdown(false);
    }
  }, [airportSearch]);
  
  // Search avoided destinations
  useEffect(() => {
    if (avoidSearchQuery.trim().length >= 2) {
      const results = searchCities(avoidSearchQuery, 8);
      setAvoidSearchResults(results);
      setAvoidSelectedIndex(0);
    } else {
      setAvoidSearchResults([]);
    }
  }, [avoidSearchQuery]);

  const handleJoinTrip = async () => {
    if (!userName.trim() || !trip) return;

    setIsJoining(true);

    try {
      const { data, error } = await supabase
        .from("participants")
        .insert({
          blend_id: trip.id,
          name: userName.trim(),
          home_airport: homeAirport || null,
        })
        .select()
        .single();

      if (error) throw error;

      const profile = { id: data.id, name: userName.trim(), homeAirport: homeAirport || undefined };
      setStoredProfile(code, profile);
      setCurrentUserId(data.id);
      setUserName(userName.trim());
      setHomeAirport(homeAirport || "");
      setHasJoined(true);
      toast.success(`Welcome, ${userName}!`);
      fetchTripData();
    } catch (err) {
      console.error("Error joining:", err);
      toast.error("Failed to join trip");
    } finally {
      setIsJoining(false);
    }
  };

  const handleUseExistingProfile = () => {
    if (existingProfile) {
      setCurrentUserId(existingProfile.id);
      setUserName(existingProfile.name);
      setHomeAirport(existingProfile.homeAirport || "");
      setHasJoined(true);
    }
  };

  const handleEditName = () => {
    setEditNameValue(userName);
    setIsEditingName(true);
  };

  const handleAddPerson = async () => {
    if (!newPersonName.trim() || isCreatingPerson || !trip) return;
    
    setIsCreatingPerson(true);
    try {
      const { data: newParticipant, error } = await supabase
        .from("participants")
        .insert({
          blend_id: trip.id,
          name: newPersonName.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`${newPersonName} added to trip`);
      setParticipants([...participants, newParticipant]);
      setNewPersonName("");
      setIsAddingPerson(false);
    } catch (error) {
      console.error("Error adding person:", error);
      toast.error("Failed to add person");
    } finally {
      setIsCreatingPerson(false);
    }
  };

  const handleEditTripName = () => {
    setEditTripNameValue(trip?.name || "");
    setIsEditingTripName(true);
  };

  const handleSaveTripName = async () => {
    if (!editTripNameValue.trim() || isSavingTripName || !trip) return;
    
    setIsSavingTripName(true);
    try {
      const { error } = await supabase
        .from("blends")
        .update({ name: editTripNameValue.trim() })
        .eq("id", trip.id);

      if (error) throw error;

      setTrip({ ...trip, name: editTripNameValue.trim() });
      toast.success("Trip name updated");
      setIsEditingTripName(false);
    } catch (error) {
      console.error("Error updating trip name:", error);
      toast.error("Failed to update trip name");
    } finally {
      setIsSavingTripName(false);
    }
  };

  const handleSaveAlias = async () => {
    if (!aliasValue.trim() || isSavingAlias || !trip) return;
    
    // Convert to slug format
    const slug = aliasValue.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    if (slug.length < 3) {
      toast.error("Alias must be at least 3 characters");
      return;
    }
    
    setIsSavingAlias(true);
    try {
      // First check if alias already exists for a different trip
      const { data: existingTrip, error: checkError } = await supabase
        .from("blends")
        .select("id")
        .eq("alias", slug)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingTrip && existingTrip.id !== trip.id) {
        toast.error("This alias is already taken by another trip");
        return;
      }

      const { error } = await supabase
        .from("blends")
        .update({ alias: slug })
        .eq("id", trip.id);

      if (error) throw error;

      setTrip({ ...trip, alias: slug });
      toast.success(`Trip alias set to ${slug}`);
      setShowAliasDialog(false);
      setAliasValue("");
      
      // Update URL in browser to reflect new alias
      window.history.replaceState({}, '', `/trip/${slug}`);
    } catch (error: any) {
      console.error("Error setting alias:", error);
      if (error?.code === "23505") {
        toast.error("This alias is already taken");
      } else {
        toast.error("Failed to set alias");
      }
    } finally {
      setIsSavingAlias(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    }
  };

  const handleSaveName = async () => {
    if (!editNameValue.trim() || !currentUserId) return;

    setIsSavingName(true);

    try {
      const { error } = await supabase
        .from("participants")
        .update({ name: editNameValue.trim() })
        .eq("id", currentUserId);

      if (error) throw error;

      setUserName(editNameValue.trim());
      setStoredProfile(code, { id: currentUserId, name: editNameValue.trim(), homeAirport: homeAirport || undefined });
      setIsEditingName(false);
      toast.success("Name updated!");
      fetchTripData();
    } catch {
      toast.error("Failed to update name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleRemoveProfile = async () => {
    if (!currentUserId) return;

    try {
      await supabase.from("availability").delete().eq("participant_id", currentUserId);
      await supabase.from("destinations").delete().eq("participant_id", currentUserId);
      await supabase.from("participants").delete().eq("id", currentUserId);

      removeStoredProfile(code);
      setCurrentUserId(null);
      setHasJoined(false);
      setUserName("");
      setHomeAirport("");
      setExistingProfile(null);
      toast.success("Left the trip");
      fetchTripData();
    } catch {
      toast.error("Failed to leave trip");
    }
  };

  const handleSaveHomeAirport = async (airportCode: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("participants")
        .update({ home_airport: airportCode })
        .eq("id", currentUserId);

      if (error) throw error;

      setHomeAirport(airportCode);
      setStoredProfile(code, { id: currentUserId, name: userName, homeAirport: airportCode });
      toast.success("Home airport saved!");
    } catch {
      toast.error("Failed to save home airport");
    }
  };

  const toggleMonth = async (monthKey: string) => {
    if (!currentUserId) return;

    const hasVoted = availability.some(
      (a) => a.participant_id === currentUserId && a.year_month === monthKey
    );

    // Optimistic update - instant UI feedback
    if (hasVoted) {
      setAvailability(prev => prev.filter(
        a => !(a.participant_id === currentUserId && a.year_month === monthKey)
      ));
    } else {
      setAvailability(prev => [...prev, {
        participant_id: currentUserId,
        year_month: monthKey,
        id: `temp-${Date.now()}`,
        blend_id: trip?.id || ''
      }]);
    }

    try {
      if (hasVoted) {
        await supabase
          .from("availability")
          .delete()
          .eq("participant_id", currentUserId)
          .eq("year_month", monthKey);
      } else {
        await supabase.from("availability").insert({
          participant_id: currentUserId,
          year_month: monthKey,
        });
      }
      // Only refetch to get server-generated data if needed
    } catch (error) {
      // Rollback optimistic update on error
      console.error("[v0] Failed to toggle month:", error);
      fetchTripData();
      toast.error("Failed to update availability");
    }
  };

  const addDestination = async (dest: CityData) => {
    if (!currentUserId) return;

    const alreadyAdded = destinations.some(
      (d) => d.participant_id === currentUserId && d.destination_key === dest.id
    );
    if (alreadyAdded) {
      toast.error("You already added this destination");
      return;
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempDestination = {
      id: tempId,
      participant_id: currentUserId,
      destination_key: dest.id,
      destination_data: dest,
      interest_level: 3,
      blend_id: trip?.id || ''
    };
    setDestinations(prev => [...prev, tempDestination]);
    setSearchQuery("");
    setShowSearch(false);
    toast.success(`Added ${dest.name}`);

    try {
      const { data, error } = await supabase.from("destinations")
        .insert({
          participant_id: currentUserId,
          destination_key: dest.id,
          destination_data: dest,
          interest_level: 3,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp with real data
      setDestinations(prev => prev.map(d => d.id === tempId ? data : d));
    } catch (error) {
      console.error("[v0] Failed to add destination:", error);
      // Rollback optimistic update
      setDestinations(prev => prev.filter(d => d.id !== tempId));
      toast.error("Failed to add destination");
    }
  };

  const removeDestination = async (destId: string) => {
    if (!currentUserId) return;

    // Optimistic update - remove immediately
    const removedDest = destinations.find(d => d.id === destId);
    setDestinations(prev => prev.filter(d => d.id !== destId));

    try {
      await supabase.from("destinations").delete().eq("id", destId);
    } catch (error) {
      console.error("[v0] Failed to remove destination:", error);
      // Rollback optimistic update
      if (removedDest) {
        setDestinations(prev => [...prev, removedDest]);
      }
      toast.error("Failed to remove destination");
    }
  };
  
  const addAvoidedDestination = async (dest: CityData) => {
    if (!currentUserId) return;

    const alreadyAvoided = avoidedDestinations.some(
      (d) => d.participant_id === currentUserId && d.destination_key === dest.id
    );
    if (alreadyAvoided) {
      toast.error("Already in your avoid list");
      return;
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempAvoided = {
      id: tempId,
      participant_id: currentUserId,
      destination_key: dest.id,
      destination_data: dest,
      blend_id: trip?.id || ''
    };
    setAvoidedDestinations(prev => [...prev, tempAvoided]);
    setAvoidSearchQuery("");
    setShowAvoidSearch(false);
    toast.success(`Will avoid ${dest.name}`);

    try {
      const { data, error } = await supabase.from("avoided_destinations")
        .insert({
          participant_id: currentUserId,
          destination_key: dest.id,
          destination_data: dest,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp with real data
      setAvoidedDestinations(prev => prev.map(d => d.id === tempId ? data : d));
    } catch (error) {
      console.error("[v0] Failed to add avoided destination:", error);
      // Rollback optimistic update
      setAvoidedDestinations(prev => prev.filter(d => d.id !== tempId));
      toast.error("Failed to add to avoid list");
    }
  };

  const removeAvoidedDestination = async (destId: string) => {
    if (!currentUserId) return;

    // Optimistic update
    const removed = avoidedDestinations.find(d => d.id === destId);
    setAvoidedDestinations(prev => prev.filter(d => d.id !== destId));

    try {
      await supabase.from("avoided_destinations").delete().eq("id", destId);
    } catch (error) {
      console.error("[v0] Failed to remove avoided destination:", error);
      // Rollback optimistic update
      if (removed) {
        setAvoidedDestinations(prev => [...prev, removed]);
      }
      toast.error("Failed to remove from avoid list");
    }
  };
  
  const handleAvoidSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAvoidSelectedIndex((prev) => Math.min(prev + 1, avoidSearchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAvoidSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && avoidSearchResults.length > 0) {
      e.preventDefault();
      addAvoidedDestination(avoidSearchResults[avoidSelectedIndex]);
    } else if (e.key === "Escape") {
      setShowAvoidSearch(false);
      setAvoidSearchQuery("");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault();
      addDestination(searchResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const handleAirportKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAirportDropdown || airportResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedAirportIndex((prev) => Math.min(prev + 1, airportResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedAirportIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = airportResults[selectedAirportIndex];
      setAirportSearch(`${selected.city} (${selected.code})`);
      handleSaveHomeAirport(selected.code);
      setShowAirportDropdown(false);
    } else if (e.key === "Escape") {
      setShowAirportDropdown(false);
    }
  };

  const copyLink = async () => {
    const linkCode = trip.alias || code;
    const url = `${window.location.origin}/trip/${linkCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate recommendations
const getRecommendations = () => {
  const monthVotes: Record<string, string[]> = {};
  for (const m of months) {
  monthVotes[m.key] = availability
  .filter((a) => a.year_month === m.key)
  .map((a) => participants.find((p) => p.id === a.participant_id)?.name || "");
  }
  
  // Get list of avoided destination keys by anyone in the group
  const avoidedKeys = new Set(avoidedDestinations.map((d) => d.destination_key));
  
  const destVotes: Record<string, { dest: CityData; voters: string[] }> = {};
  for (const pick of destinations) {
  // Skip if this destination is avoided by anyone
  if (avoidedKeys.has(pick.destination_key)) continue;
  
  const dest = pick.destination_data || CITIES.find((c) => c.id === pick.destination_key);
  if (!dest) continue;
  
  if (!destVotes[pick.destination_key]) {
  destVotes[pick.destination_key] = { dest, voters: [] };
  }
  const voterName = participants.find((p) => p.id === pick.participant_id)?.name;
  if (voterName) {
  destVotes[pick.destination_key].voters.push(voterName);
  }
  }
  
  const sortedMonths = months
  .map((m) => ({
  ...m,
  voters: monthVotes[m.key],
  voteCount: monthVotes[m.key].length,
  }))
  .filter((m) => m.voteCount > 0)
  .sort((a, b) => b.voteCount - a.voteCount);
  
  const sortedDestinations = Object.values(destVotes).sort((a, b) => b.voters.length - a.voters.length);
  
  return { sortedMonths, sortedDestinations, monthVotes };
  };

  const { sortedMonths, sortedDestinations, monthVotes } = getRecommendations();

  // Calculate top trip suggestions with superlative badges
  type SuggestionBadge = {
    label: string;
    variant: "default" | "secondary" | "outline";
    color?: string;
  };

  const topSuggestions = (() => {
    if (sortedDestinations.length === 0 || sortedMonths.length === 0) return [];
    
    const suggestions: Array<{
      dest: CityData;
      month: { key: string; label: string; month: number };
      voters: string[];
      monthVoters: string[];
      score: number;
      seasonInfo: ReturnType<typeof getSeasonLabel>;
      badges: SuggestionBadge[];
    }> = [];
    
    for (const destItem of sortedDestinations) {
      for (const month of sortedMonths) {
        const seasonInfo = getSeasonLabel(month.month, destItem.dest);
        const seasonBonus = seasonInfo.label === "Peak Season" ? 2 : seasonInfo.label === "Shoulder Season" ? 1 : 0;
        const score = destItem.voters.length * 3 + month.voteCount * 2 + seasonBonus;
        
        suggestions.push({
          dest: destItem.dest,
          month,
          voters: destItem.voters,
          monthVoters: month.voters,
          score,
          seasonInfo,
          badges: [],
        });
      }
    }
    
    const sorted = suggestions.sort((a, b) => b.score - a.score).slice(0, 20);
    
    // Assign superlative badges after sorting
    if (sorted.length > 0) {
      // Best Overall Match - top scored
      sorted[0].badges.push({ label: "Best Match", variant: "default" });
      
      // Most Popular - highest voter count
      const maxVoters = Math.max(...sorted.map(s => s.voters.length));
      const mostPopular = sorted.find(s => s.voters.length === maxVoters && s !== sorted[0]);
      if (mostPopular && mostPopular.voters.length > 1) {
        mostPopular.badges.push({ label: "Most Popular", variant: "secondary" });
      }
      
      // Best Overlap - highest month voter alignment
      const maxMonthVoters = Math.max(...sorted.map(s => s.monthVoters.length));
      const bestOverlap = sorted.find(s => s.monthVoters.length === maxMonthVoters && !s.badges.length);
      if (bestOverlap && bestOverlap.monthVoters.length > 1) {
        bestOverlap.badges.push({ label: "Best Overlap", variant: "secondary" });
      }
      
      // Best Peak Season
      const bestPeak = sorted.find(s => s.seasonInfo.label === "Peak Season" && !s.badges.length);
      if (bestPeak) {
        bestPeak.badges.push({ label: "Best Peak Season", variant: "outline", color: "text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950" });
      }
      
      // Best Shoulder Season
      const bestShoulder = sorted.find(s => s.seasonInfo.label === "Shoulder Season" && !s.badges.length);
      if (bestShoulder) {
        bestShoulder.badges.push({ label: "Best Shoulder Season", variant: "outline", color: "text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-950/30" });
      }
      
      // Best Off Season (Budget Pick)
      const bestOff = sorted.find(s => s.seasonInfo.label === "Off Season" && !s.badges.length);
      if (bestOff) {
        bestOff.badges.push({ label: "Budget Pick", variant: "outline", color: "text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-950" });
      }
    }
    
    return sorted;
  })();

  const getTripLength = (dest: CityData): string => {
    if (dest.type === "country") return "10-14 days";
    if (dest.type === "region") return "7-10 days";
    return "4-7 days";
  };

  // Get best month for a destination based on overlap with group availability
  const getBestMonthForDestination = (dest: CityData): { month: number; label: string } | null => {
    const availableMonths = sortedMonths.map(m => m.month);
    if (availableMonths.length === 0) return null;
    
    // Find best month that overlaps with group availability
    if (dest.bestMonths) {
      const bestOverlap = availableMonths.find(m => dest.bestMonths?.includes(m));
      if (bestOverlap) {
        return { month: bestOverlap, label: MONTHS[bestOverlap - 1] };
      }
    }
    
    // Find shoulder month
    if (dest.shoulderMonths) {
      const shoulderOverlap = availableMonths.find(m => dest.shoulderMonths?.includes(m));
      if (shoulderOverlap) {
        return { month: shoulderOverlap, label: MONTHS[shoulderOverlap - 1] };
      }
    }
    
    // Default to first available month
    return { month: availableMonths[0], label: MONTHS[availableMonths[0] - 1] };
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Loading trip...
        </div>
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium">{error || "Trip not found"}</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Join screen
  if (!hasJoined) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4 mx-0">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Plane className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold">{trip.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {participants.length} {participants.length === 1 ? "person" : "people"} planning
            </p>
            {participants.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Trip code: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{code}</code>
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {existingProfile && (
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={() => {
                  setStoredProfile(code, { id: existingProfile.id, name: existingProfile.name, homeAirport: existingProfile.homeAirport });
                  setCurrentUserId(existingProfile.id);
                  setUserName(existingProfile.name);
                  setHomeAirport(existingProfile.homeAirport || "");
                  setHasJoined(true);
                }}
              >
                <Avatar name={existingProfile.name} size="sm" />
                Continue as {existingProfile.name}
              </Button>
            )}
            
            {/* Sign in section for other participants */}
            {participants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {existingProfile ? "Or sign in as someone else:" : "Sign in as:"}
                </p>
                <div className="space-y-2">
                  {participants
                    .filter((p) => !existingProfile || p.id !== existingProfile.id)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <Avatar name={p.name} size="lg" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{p.name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent"
                          onClick={() => {
                            setStoredProfile(code, { id: p.id, name: p.name, homeAirport: p.home_airport || undefined });
                            setCurrentUserId(p.id);
                            setUserName(p.name);
                            setHomeAirport(p.home_airport || "");
                            setHasJoined(true);
                          }}
                        >
                          Sign in
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {participants.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or join as someone else</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Your name</label>
                <Input
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinTrip()}
                />
              </div>

              <div className="relative">
                <label className="text-sm font-medium mb-1.5 block">Home airport (optional)</label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search airport (e.g., JFK, London)"
                    value={airportSearch}
                    onChange={(e) => setAirportSearch(e.target.value)}
                    onKeyDown={handleAirportKeyDown}
                    onFocus={() => airportSearch.length >= 2 && setShowAirportDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAirportDropdown(false), 200)}
                    className="pl-9"
                  />
                </div>
                {showAirportDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-auto">
                    {airportResults.map((airport, index) => (
                      <button
                        key={airport.code}
                        type="button"
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                          index === selectedAirportIndex && "bg-muted"
                        )}
                        onMouseDown={() => {
                          setAirportSearch(`${airport.city} (${airport.code})`);
                          setHomeAirport(airport.code);
                          setShowAirportDropdown(false);
                        }}
                      >
                        <div className="font-medium">
                          {airport.city} ({airport.code})
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{airport.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={handleJoinTrip} disabled={!userName.trim() || isJoining} className="w-full">
                {isJoining ? "Joining..." : "Join Trip"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const currentUser = participants.find((p) => p.id === currentUserId);
  const myDestinations = destinations.filter((d) => d.participant_id === currentUserId);
  const myAvoided = avoidedDestinations.filter((d) => d.participant_id === currentUserId);
  const myAvailability = availability.filter((a) => a.participant_id === currentUserId);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Plane className="h-5 w-5 text-primary" />
            <div>
              <button 
                onClick={handleEditTripName}
                className="font-semibold text-foreground leading-none hover:text-primary transition-colors cursor-pointer"
              >
                {trip.name}
              </button>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">
                  {participants.length} {participants.length === 1 ? "traveler" : "travelers"}
                </p>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">{code}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyLink} 
              className="gap-2 bg-transparent"
            >
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              <span className="hidden sm:inline">Share</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Avatar name={currentUser?.name || userName} size="sm" />
                  <span className="hidden sm:inline">{currentUser?.name || userName}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleEditName}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Change name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddingPerson(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Add person
                </DropdownMenuItem>
                {participants.length > 1 && <DropdownMenuSeparator />}
                {participants.length > 1 && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Profile</DropdownMenuLabel>
                    {participants.map((p) => (
                      p.id !== currentUserId && (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => {
                            setStoredProfile(code, { id: p.id, name: p.name, homeAirport: p.home_airport || undefined });
                            setCurrentUserId(p.id);
                            setUserName(p.name);
                            setHomeAirport(p.home_airport || "");
                            toast.success(`Switched to ${p.name}`);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Avatar name={p.name} size="sm" />
                          {p.name}
                        </DropdownMenuItem>
                    )
                  ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleThemeChange("system")} className="flex items-center justify-between">
                  <span>Auto</span>
                  {theme === "system" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("light")} className="flex items-center justify-between">
                  <span>Light</span>
                  {theme === "light" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("dark")} className="flex items-center justify-between">
                  <span>Dark</span>
                  {theme === "dark" && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setAliasValue(trip.alias || "");
                    setShowAliasDialog(true);
                  }}
                  className="flex-col items-start gap-0.5"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Pencil className="h-4 w-4" />
                    <span>Customize link</span>
                  </div>
                  {trip.alias && (
                    <span className="text-xs text-muted-foreground ml-6 font-mono">
                      /trip/{trip.alias}
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-3 pb-20 lg:pb-0">
          {/* Left Column: Settings & Controls - Flush Inline Panel */}
          {/* Mobile: Show based on tab selection, Desktop: Always visible */}
          <div className={cn(
            "order-2 lg:order-1 border rounded-lg p-4 bg-card space-y-4",
            "hidden lg:block",
            mobileTab === "preferences" && "block lg:block"
          )}>
            {/* Home Airport */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="h-4 w-4" />
                <h3 className="text-sm font-medium">Origin airport (home)</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Set your home airport so we can link to flight searches for each suggestion.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
                <div className="relative max-w-md">
                  <Input
                    placeholder="Search airport (e.g., JFK, London)"
                    value={airportSearch || (homeAirport ? `${AIRPORTS.find((a) => a.code === homeAirport)?.city || ""} (${homeAirport})` : "")}
                    onChange={(e) => setAirportSearch(e.target.value)}
                    onKeyDown={handleAirportKeyDown}
                    onFocus={() => {
                      setAirportSearch("");
                    }}
                    onBlur={() => setTimeout(() => setShowAirportDropdown(false), 200)}
                  />
                  {showAirportDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-auto">
                      {airportResults.map((airport, index) => (
                        <button
                          key={airport.code}
                          type="button"
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                            index === selectedAirportIndex && "bg-muted"
                          )}
                          onMouseDown={() => {
                            setAirportSearch(`${airport.city} (${airport.code})`);
                            handleSaveHomeAirport(airport.code);
                            setShowAirportDropdown(false);
                          }}
                        >
                          <div className="font-medium">
                            {airport.city} ({airport.code})
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{airport.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {homeAirport && <p className="text-sm text-muted-foreground mt-2">Flights will be searched from {homeAirport}</p>}
            </div>

            {/* Destinations */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                <h3 className="text-sm font-medium">Destinations</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Search and add places you want to visit. Tap existing tags to toggle interest. More votes from your group means better suggestions.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search cities, countries, or regions..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearch(true);
                  }}
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10 pr-16"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-mono border">
                  <span className="text-[10px]">&#8984;</span>K
                </kbd>

                {showSearch && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-72 overflow-auto">
                    {searchResults.map((city, index) => (
                      <button
                        key={city.id}
                        type="button"
                        className={cn(
                          "w-full px-3 py-2.5 text-left hover:bg-muted transition-colors flex items-center justify-between",
                          index === selectedIndex && "bg-muted"
                        )}
                        onMouseDown={() => addDestination(city)}
                      >
                        <div>
                          <div className="font-medium">{city.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {city.country && `${city.country} · `}
                            {city.region}
                          </div>
                        </div>
                        {index === 0 && <span className="text-xs text-muted-foreground">Press Enter</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* All destinations as togglable tags */}
              {destinations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(
                    new Map(
                      destinations.map((d) => {
                        const city = d.destination_data || CITIES.find((c) => c.id === d.destination_key);
                        return [d.destination_key, { dest: d, city }];
                      })
                    ).values()
                  ).map(({ dest, city }) => {
                    const voterCount = destinations.filter((d) => d.destination_key === dest.destination_key).length;
                    const userHasAdded = myDestinations.some((d) => d.destination_key === dest.destination_key);
                    const userDestId = myDestinations.find((d) => d.destination_key === dest.destination_key)?.id;
                    
                    return (
                      <button
                        key={dest.destination_key}
                        type="button"
                        role="checkbox"
                        aria-checked={userHasAdded}
                        aria-label={`${city?.name || dest.destination_key}, ${voterCount} ${voterCount === 1 ? 'person' : 'people'} interested${userHasAdded ? ', selected' : ''}`}
                        onClick={() => {
                          if (userHasAdded && userDestId) {
                            removeDestination(userDestId);
                          } else if (city) {
                            addDestination(city);
                          }
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1",
                          userHasAdded
                            ? "bg-foreground/10 dark:bg-foreground/20 text-foreground border-foreground/30 font-medium"
                            : "bg-card hover:bg-muted cursor-pointer"
                        )}
                      >
                        <span>{city?.name || dest.destination_key}</span>
                        <span className="text-xs opacity-70">({voterCount})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            
            {/* Availability */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <h3 className="text-sm font-medium">When are you free?</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-xs">Select all months when you could travel. We will find the best overlap across your group to suggest optimal timing.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-x-0">
                {months.map((month) => {
                  const isSelected = myAvailability.some((a) => a.year_month === month.key);
                  const voters = monthVotes[month.key] || [];

                  return (
                    <label
                      key={month.key}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={`${month.label}${voters.length > 0 ? `, ${voters.length} people available` : ''}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleMonth(month.key);
                        }
                      }}
                      className="flex items-center rounded-lg hover:bg-muted/50 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1 min-h-[36px] py-0 gap-3 mx-0 px-2"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMonth(month.key)}
                        tabIndex={-1}
                        className="h-4 w-4 rounded border-input cursor-pointer shrink-0 accent-foreground"
                      />
                      <span className="font-medium text-sm flex-1">{month.label}</span>
                      <span className="text-xs text-muted-foreground min-w-[48px] text-right">
                        {voters.length > 0 ? (
                          isSelected || voters.includes(currentUser?.name || userName)
                            ? `You${voters.length > 1 ? ` and ${voters.length - 1} ${voters.length - 1 === 1 ? "other" : "others"}` : ""}`
                            : `${voters.length} ${voters.length === 1 ? "person" : "people"}`
                        ) : null}
                      </span>
                      {/* Avatar overlay showing who voted */}
                      {voters.length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-2">
                            {voters.slice(0, 3).map((voter) => (
                              <div key={voter} className="relative">
                                <Avatar name={voter} size="sm" />
                              </div>
                            ))}
                            {voters.length > 3 && (
                              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                                +{voters.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Trip Recommendations - Fixed Position */}
          {/* Mobile: Show based on tab selection, Desktop: Always visible */}
          <div className={cn(
            "space-y-2 order-1 lg:order-2",
            "hidden lg:block",
            mobileTab === "suggestions" && "block lg:block"
          )}>
            {/* Empty State */}
            {sortedDestinations.length === 0 && sortedMonths.length === 0 && (
              <div className="border rounded-lg p-6 bg-card text-center">
                <Plane className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No suggestions yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
                  Add destinations and mark your availability to see personalized trip suggestions.
                </p>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground max-w-xs mx-auto text-left">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 mt-0.5 shrink-0">1</span>
                    <span>Search and add destinations you want to visit</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 mt-0.5 shrink-0">2</span>
                    <span>Select months when you are free to travel</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 mt-0.5 shrink-0">3</span>
                    <span>Share with friends so they can add their preferences</span>
                  </div>
                </div>
              </div>
            )}

            {/* Partial progress empty states */}
            {sortedDestinations.length === 0 && sortedMonths.length > 0 && (
              <div className="border rounded-lg p-5 bg-card text-center">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <h3 className="font-medium text-foreground mb-1">Add some destinations</h3>
                <p className="text-sm text-muted-foreground">
                  You have marked your availability. Now add places you want to visit to see suggestions.
                </p>
              </div>
            )}

            {sortedDestinations.length > 0 && sortedMonths.length === 0 && (
              <div className="border rounded-lg p-5 bg-card text-center">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <h3 className="font-medium text-foreground mb-1">When are you free?</h3>
                <p className="text-sm text-muted-foreground">
                  You have {sortedDestinations.length} {sortedDestinations.length === 1 ? 'destination' : 'destinations'}. Now mark which months work for you.
                </p>
              </div>
            )}

            {/* Recommendations */}
            {(sortedMonths.length > 0 && sortedDestinations.length > 0) && (
              <div>
                {/* Share Results Button */}
                {topSuggestions.length > 0 && (
                  <div className="mb-3">
                    <Button
                      onClick={() => setShowRecapDialog(true)}
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Share trip results
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  <div>
                      
                      <div className="space-y-2">
                        {topSuggestions.map((suggestion, index) => (
                            <div 
                              key={`${suggestion.dest.id}-${suggestion.month.key}`} 
                              className="p-3 rounded-lg border bg-muted/50 transition-all duration-300 ease-out"
                              style={{
                                transform: `translateY(0)`,
                                animation: 'slideIn 0.3s ease-out',
                                animationDelay: `${index * 50}ms`,
                                animationFillMode: 'backwards'
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold">
                                      {suggestion.dest.name} in {suggestion.month.label}
                                    </span>
                                    {suggestion.badges.map((badge) => (
                                      <Badge 
                                        key={badge.label} 
                                        variant={badge.variant} 
                                        className={cn("text-xs", badge.color)}
                                      >
                                        {badge.label}
                                      </Badge>
                                    ))}
                                  </div>
                                  {suggestion.dest.country && (
                                    <p className="text-sm text-muted-foreground">
                                      {suggestion.dest.country} · {suggestion.dest.region}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                      <div className="flex -space-x-1.5">
                                        {[...new Set([...suggestion.voters, ...suggestion.monthVoters])].slice(0, 3).map((voter) => (
                                          <TooltipProvider key={voter}>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div>
                                                  <Avatar name={voter} size="xs" />
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>{voter}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ))}
                                      </div>
                                      {[...new Set([...suggestion.voters, ...suggestion.monthVoters])].length > 3 && (
                                        <span className="text-xs">+{[...new Set([...suggestion.voters, ...suggestion.monthVoters])].length - 3}</span>
                                      )}
                                      <span>{suggestion.voters.length} want to go</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3.5 w-3.5" />
                                      <span className="hidden sm:inline">
                                        {suggestion.monthVoters.length <= 3 
                                          ? suggestion.monthVoters.join(", ").replace(/,([^,]*)$/, " and$1")
                                          : `${suggestion.monthVoters.length} people`} free in {suggestion.month.label}
                                      </span>
                                      <span className="inline sm:hidden">
                                        {suggestion.monthVoters.length} free in {suggestion.month.label}
                                      </span>
                                    </div>
                                    <Badge variant="outline" className={cn("text-xs border", suggestion.seasonInfo.color)}>
                                      {suggestion.seasonInfo.label}
                                    </Badge>
                                  </div>
                                </div>
                                {(suggestion.dest.airportCode || suggestion.dest.nearestAirports?.length) && homeAirport && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 shrink-0 bg-transparent"
                                    onClick={() => {
                                      const destAirport = suggestion.dest.airportCode || suggestion.dest.nearestAirports?.[0]?.code;
                                      if (destAirport) {
                                        window.open(getGoogleFlightsUrl(homeAirport, destAirport, suggestion.month.key), "_blank");
                                      }
                                    }}
                                  >
                                    <Plane className="h-3.5 w-3.5" />
                                    Check Price  
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                                {(suggestion.dest.airportCode || suggestion.dest.nearestAirports?.length) && !homeAirport && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 shrink-0 bg-transparent text-muted-foreground"
                                    onClick={() => {
                                      console.log("[v0] homeAirport state:", homeAirport, "currentUserId:", currentUserId);
                                      setMobileTab("preferences");
                                    }}
                                  >
                                    <Plane className="h-3.5 w-3.5" />
                                    Add Airport
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                      {!homeAirport && sortedDestinations.some((d) => d.dest.airportCode || d.dest.nearestAirports?.length) && (
                        <p className="text-sm text-muted-foreground mt-3">Set your home airport above to search for flights</p>
                      )}
                    </div>
                </div>
              </div>
            )}

            {/* Participants */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Trip Members
              </h3>
              <div className="space-y-2">
                {participants.map((p) => {
                  const pDests = destinations.filter((d) => d.participant_id === p.id);
                  const pAvail = availability.filter((a) => a.participant_id === p.id);
                  
                  return (
                    <div key={p.id} className="px-3 py-2 rounded-lg bg-muted/50 space-y-1.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} size="md" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">
                            {p.name}
                            {p.id === currentUserId && <span className="text-muted-foreground font-normal"> (you)</span>}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {pAvail.length} {pAvail.length === 1 ? "month" : "months"} available
                          </p>
                        </div>
                      </div>
                      {pDests.length > 0 && (
                        <div className="pl-11">
                          <p className="text-xs text-muted-foreground mb-1.5">Interested in:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {pDests.map((d) => {
                              const city = d.destination_data || CITIES.find((c) => c.id === d.destination_key);
                              return (
                                <Badge key={d.id} variant="secondary" className="text-xs font-normal">
                                  {city?.name || d.destination_key}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {pDests.length === 0 && (
                        <p className="pl-11 text-xs text-muted-foreground italic">No destinations added yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tabs - Liquid Glass */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center">
        <div className="mb-3 flex gap-1.5 rounded-2xl bg-black/10 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-black/20 shadow-lg p-1">
          <button
            onClick={() => setMobileTab("preferences")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 text-xs font-medium rounded-xl transition-all min-w-[80px]",
              mobileTab === "preferences"
                ? "bg-white dark:bg-black text-foreground shadow-md"
                : "bg-black/10 dark:bg-white/10 text-muted-foreground hover:bg-black/20 dark:hover:bg-white/20"
            )}
          >
            <Navigation className="h-4 w-4" />
            <span>Preferences</span>
          </button>
          <button
            onClick={() => setMobileTab("suggestions")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 text-xs font-medium rounded-xl transition-all min-w-[80px]",
              mobileTab === "suggestions"
                ? "bg-white dark:bg-black text-foreground shadow-md"
                : "bg-black/10 dark:bg-white/10 text-muted-foreground hover:bg-black/20 dark:hover:bg-white/20"
            )}
          >
            <Plane className="h-4 w-4" />
            <span>{topSuggestions.length} Suggestions</span>
          </button>
        </div>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change your name</DialogTitle>
            <DialogDescription>Update how you appear to other travelers</DialogDescription>
          </DialogHeader>
          <Input
            value={editNameValue}
            onChange={(e) => setEditNameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            placeholder="Your name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingName(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveName} disabled={!editNameValue.trim() || isSavingName}>
              {isSavingName ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Person Dialog */}
      <Dialog open={isAddingPerson} onOpenChange={setIsAddingPerson}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add someone to the trip</DialogTitle>
            <DialogDescription>Invite another person to join your travel planning</DialogDescription>
          </DialogHeader>
          <Input
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
            placeholder="Their name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingPerson(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPerson} disabled={!newPersonName.trim() || isCreatingPerson}>
              {isCreatingPerson ? "Adding..." : "Add person"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Trip Name Dialog */}
      <Dialog open={isEditingTripName} onOpenChange={setIsEditingTripName}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit trip name</DialogTitle>
            <DialogDescription>Give your trip a memorable name</DialogDescription>
          </DialogHeader>
          <Input
            value={editTripNameValue}
            onChange={(e) => setEditTripNameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveTripName()}
            placeholder="Trip name"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingTripName(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTripName} disabled={!editTripNameValue.trim() || isSavingTripName}>
              {isSavingTripName ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customize Alias Dialog */}
      <Dialog open={showAliasDialog} onOpenChange={setShowAliasDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize trip link</DialogTitle>
            <DialogDescription>Create a custom URL for your trip (e.g., "summer-vacation")</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={aliasValue}
              onChange={(e) => setAliasValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveAlias()}
              placeholder="my-trip-name"
            />
          {aliasValue && (
            <p className="text-xs text-muted-foreground">
              Your link: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{window.location.origin}/trip/{aliasValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}</code>
            </p>
          )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAliasDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAlias} disabled={!aliasValue.trim() || isSavingAlias}>
              {isSavingAlias ? "Saving..." : "Save alias"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trip Recap Dialog */}
      <Dialog open={showRecapDialog} onOpenChange={setShowRecapDialog}>
        <DialogContent className="max-w-md my-0 py-6 px-6">
          <DialogHeader>
            <DialogTitle>Share your trip results</DialogTitle>
          </DialogHeader>
          <TripRecapCard
            data={{
              tripName: trip?.name || "Trip",
              participantCount: participants.length,
              topDestination: topSuggestions[0] ? {
                dest: topSuggestions[0].dest,
                month: topSuggestions[0].month.label,
                voters: topSuggestions[0].voters.length
              } : undefined,
              secondDestination: topSuggestions[1] ? {
                dest: topSuggestions[1].dest,
                month: topSuggestions[1].month.label,
                voters: topSuggestions[1].voters.length
              } : undefined,
              thirdDestination: topSuggestions[2] ? {
                dest: topSuggestions[2].dest,
                month: topSuggestions[2].month.label,
                voters: topSuggestions[2].voters.length
              } : undefined,
              vibe: participants.length >= 5 
                ? "Adventure squad assembled!" 
                : participants.length >= 3 
                ? "Small group, big plans" 
                : "Dynamic duo ready to explore",
              shareUrl: typeof window !== "undefined" ? window.location.href : ""
            }}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
