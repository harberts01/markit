"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import {
  useManagerMarketDays,
  useCreateManagerMarketDay,
  useDeleteManagerMarketDay,
  useManagerReservations,
  useManagerCancelReservation,
} from "@/lib/hooks/use-manager-reservations";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReservationsPageClientProps {
  marketId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReservationsPageClient({
  marketId,
}: ReservationsPageClientProps) {
  // --- Market Days tab state ---
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [deleteDayId, setDeleteDayId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // --- Reservations tab state ---
  const [filterDayId, setFilterDayId] = useState<number | undefined>(undefined);
  const [cancelReservationId, setCancelReservationId] = useState<number | null>(
    null
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // --- Hooks ---
  const { days, isLoading: daysLoading } = useManagerMarketDays(marketId);
  const createDay = useCreateManagerMarketDay();
  const deleteDay = useDeleteManagerMarketDay();

  const { reservations, isLoading: reservationsLoading } =
    useManagerReservations(marketId, filterDayId);
  const cancelReservation = useManagerCancelReservation();

  // ---------------------------------------------------------------------------
  // Handlers — Market Days tab
  // ---------------------------------------------------------------------------

  function handleAddDay() {
    if (!newDate) return;
    createDay.mutate(
      { marketId, marketDate: newDate, notes: newNotes || undefined },
      {
        onSuccess: () => {
          setNewDate("");
          setNewNotes("");
        },
      }
    );
  }

  function openDeleteDialog(dayId: number) {
    setDeleteDayId(dayId);
    setDeleteDialogOpen(true);
  }

  function confirmDeleteDay() {
    if (deleteDayId === null) return;
    deleteDay.mutate(
      { marketId, dayId: deleteDayId },
      { onSuccess: () => setDeleteDialogOpen(false) }
    );
  }

  // ---------------------------------------------------------------------------
  // Handlers — Reservations tab
  // ---------------------------------------------------------------------------

  function openCancelDialog(reservationId: number) {
    setCancelReservationId(reservationId);
    setCancelDialogOpen(true);
  }

  function confirmCancelReservation() {
    if (cancelReservationId === null) return;
    cancelReservation.mutate(
      { marketId, reservationId: cancelReservationId },
      { onSuccess: () => setCancelDialogOpen(false) }
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <h1 className="text-lg font-bold text-[var(--color-markit-dark)]">
          Reservations
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Manage market dates and booth reservations.
        </p>
      </div>

      <div className="px-4 pt-4">
        <Tabs defaultValue="market-days">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="market-days" className="flex-1">
              Market Days
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex-1">
              Reservations
            </TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------------------- */}
          {/* Tab 1: Market Days                                                 */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="market-days">
            {/* Add date form */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-markit-dark)]">
                Add Market Date
              </h2>
              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="market-date-input"
                    className="mb-1 block text-xs text-gray-600"
                  >
                    Date
                  </Label>
                  <input
                    id="market-date-input"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-[#B20000] focus:outline-none focus:ring-1 focus:ring-[#B20000]"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="market-notes-input"
                    className="mb-1 block text-xs text-gray-600"
                  >
                    Notes (optional)
                  </Label>
                  <Input
                    id="market-notes-input"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="e.g. Holiday market"
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={handleAddDay}
                  disabled={!newDate || createDay.isPending}
                  className="bg-[#B20000] text-white hover:bg-[#8a0000] disabled:opacity-50"
                  size="sm"
                  aria-busy={createDay.isPending}
                >
                  {createDay.isPending ? "Adding…" : "Add Date"}
                </Button>
                {createDay.isError && (
                  <p className="text-xs text-red-600" role="alert">
                    {createDay.error?.message ?? "Failed to add date."}
                  </p>
                )}
              </div>
            </div>

            {/* List of market days */}
            <h2 className="mb-2 text-sm font-semibold text-[var(--color-markit-dark)]">
              Scheduled Dates
            </h2>

            {daysLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
              </div>
            ) : days.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                No market dates scheduled yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {days.map((day) => (
                  <li
                    key={day.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-markit-dark)]">
                        {formatDate(day.marketDate)}
                      </p>
                      {day.notes && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {day.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openDeleteDialog(day.id)}
                      className="ml-4 rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label={`Delete market day ${formatDate(day.marketDate)}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* ---------------------------------------------------------------- */}
          {/* Tab 2: Reservations                                               */}
          {/* ---------------------------------------------------------------- */}
          <TabsContent value="reservations">
            {/* Date filter */}
            <div className="mb-4">
              <Label
                htmlFor="filter-day-select"
                className="mb-1 block text-xs text-gray-600"
              >
                Filter by date
              </Label>
              <Select
                value={filterDayId !== undefined ? String(filterDayId) : "all"}
                onValueChange={(value) =>
                  setFilterDayId(value === "all" ? undefined : Number(value))
                }
              >
                <SelectTrigger
                  id="filter-day-select"
                  className="w-full sm:w-64"
                >
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {days.map((day) => (
                    <SelectItem key={day.id} value={String(day.id)}>
                      {formatDate(day.marketDate)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reservations list */}
            {reservationsLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
              </div>
            ) : reservations.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                No reservations yet.
              </p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-lg border border-gray-200 md:block">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">
                          Vendor
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">
                          Booth #
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">
                          Date
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">
                          Status
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {reservations.map((r) => (
                        <tr key={r.id}>
                          <td className="px-4 py-3 font-medium text-[var(--color-markit-dark)]">
                            {r.vendorName}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {r.boothId}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDate(r.marketDate)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={
                                r.status === "confirmed"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                              }
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {r.status === "confirmed" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 border-[#B20000] px-2 text-xs text-[#B20000] hover:bg-[var(--color-markit-pink)]"
                                onClick={() => openCancelDialog(r.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <ul className="space-y-2 md:hidden">
                  {reservations.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-lg border border-gray-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--color-markit-dark)]">
                            {r.vendorName}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Booth {r.boothId} &middot; {formatDate(r.marketDate)}
                          </p>
                        </div>
                        <Badge
                          className={
                            r.status === "confirmed"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                          }
                        >
                          {r.status}
                        </Badge>
                      </div>
                      {r.status === "confirmed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 w-full border-[#B20000] px-2 text-xs text-[#B20000] hover:bg-[var(--color-markit-pink)]"
                          onClick={() => openCancelDialog(r.id)}
                        >
                          Cancel Reservation
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete market day confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Market Day</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this market day? All reservations
              for this date will also be removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteDay.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#B20000] text-white hover:bg-[#8a0000]"
              onClick={confirmDeleteDay}
              disabled={deleteDay.isPending}
              aria-busy={deleteDay.isPending}
            >
              {deleteDay.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel reservation confirmation dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this reservation? The vendor will
              lose their booth booking for this date.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelReservation.isPending}
            >
              Keep Reservation
            </Button>
            <Button
              className="bg-[#B20000] text-white hover:bg-[#8a0000]"
              onClick={confirmCancelReservation}
              disabled={cancelReservation.isPending}
              aria-busy={cancelReservation.isPending}
            >
              {cancelReservation.isPending ? "Cancelling…" : "Cancel Reservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
