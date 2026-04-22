#!/usr/bin/env python3
"""
list_events.py — fetch Family calendar events via EventKit (pyobjc).
Unlike AppleScript's `every event whose start date`, EventKit correctly
expands recurring event instances within the requested date range.

Usage:
    python3 list_events.py <from_unix_ts> <to_unix_ts> [calendar_name]

Output: one JSON array on stdout, one object per event occurrence.
"""
import sys
import json
import time

try:
    from Foundation import NSDate, NSRunLoop
    from EventKit import EKEventStore, EKEntityMaskEvent
except ImportError:
    print(json.dumps({"error": "pyobjc-framework-EventKit not available"}))
    sys.exit(1)

def main():
    from_ts  = float(sys.argv[1])
    to_ts    = float(sys.argv[2])
    cal_name = sys.argv[3] if len(sys.argv) > 3 else "Family"

    store = EKEventStore.new()

    # Request access — if already granted this resolves immediately.
    granted = [None]
    def cb(success, err):
        granted[0] = bool(success)

    store.requestFullAccessToEventsWithCompletion_(cb)

    # Give the callback up to 3 s to fire (it's usually instant if pre-granted).
    deadline = time.time() + 3
    while granted[0] is None and time.time() < deadline:
        NSRunLoop.currentRunLoop().runUntilDate_(
            NSDate.dateWithTimeIntervalSinceNow_(0.05)
        )

    if not granted[0]:
        # On older macOS the method is requestAccessToEntityType_completion_
        # Fallback: assume access already granted and proceed anyway.
        pass

    # Find the target calendar.
    calendars = [
        c for c in store.calendarsForEntityType_(0)  # 0 = EKEntityTypeEvent
        if str(c.title()) == cal_name
    ]
    if not calendars:
        print(json.dumps({"error": f"Calendar '{cal_name}' not found"}))
        sys.exit(1)

    from_date = NSDate.dateWithTimeIntervalSince1970_(from_ts)
    to_date   = NSDate.dateWithTimeIntervalSince1970_(to_ts)

    predicate = store.predicateForEventsWithStartDate_endDate_calendars_(
        from_date, to_date, calendars
    )
    events = store.eventsMatchingPredicate_(predicate)

    output = []
    for e in (events or []):
        try:
            start_ts = e.startDate().timeIntervalSince1970()
            end_ts   = e.endDate().timeIntervalSince1970()
            # Format as readable strings (local time via Python)
            from datetime import datetime
            start_dt = datetime.fromtimestamp(start_ts)
            end_dt   = datetime.fromtimestamp(end_ts)
            output.append({
                "title":      str(e.title() or ""),
                "start":      start_dt.strftime("%Y-%m-%dT%H:%M:%S"),
                "end":        end_dt.strftime("%Y-%m-%dT%H:%M:%S"),
                "location":   str(e.location() or ""),
                "notes":      str(e.notes() or ""),
                "all_day":    bool(e.isAllDay()),
                "recurring":  e.recurrenceRules() is not None and len(e.recurrenceRules()) > 0,
            })
        except Exception as ex:
            continue

    # Sort by start time
    output.sort(key=lambda x: x["start"])
    print(json.dumps(output))

if __name__ == "__main__":
    main()
