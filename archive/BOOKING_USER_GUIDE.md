# Booking System - Quick Reference Guide

## For Vendors: Setting Up Booking Products

### 24-Hour Operating Hours

When creating or editing a booking product, you'll see:

```
┌─────────────────────────────────────────────────────────┐
│ Operating Hours (24-hour format) [Set Full Day (00:00-23:59)] │
├─────────────────────────────────────────────────────────┤
│ [09:00] to [17:00] [Remove]                             │
│ [18:00] to [22:00] [Remove]                             │
│ + Add Time Range                                        │
│                                                         │
│ Time slots are in 24-hour format                       │
│ (e.g., 09:00 for 9 AM, 18:00 for 6 PM)               │
└─────────────────────────────────────────────────────────┘
```

**Quick Actions:**
- Click "Set Full Day" button → Instantly sets 00:00 - 23:59
- Click "+ Add Time Range" → Add multiple operating periods
- Click "Remove" → Delete a time range

**Examples:**
- Morning shift: 06:00 - 12:00
- Afternoon shift: 12:00 - 18:00
- Evening shift: 18:00 - 23:00
- Full day: 00:00 - 23:59
- Overnight: 22:00 - 06:00 (next day)

---

## For Customers: Booking Multiple Slots

### Step 1: Select Date
Click on any available date in the calendar.

### Step 2: Select Multiple Time Slots
```
┌─────────────────────────────────────────────────────────┐
│ Available Time Slots (3 selected)                      │
│ Click slots to select multiple time slots              │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│ │ 09:00-10:00 │  │ 10:00-11:00 │  │ 11:00-12:00 │    │
│ │   SELECTED  │  │   SELECTED  │  │   SELECTED  │    │
│ │   (BLUE)    │  │   (BLUE)    │  │   (BLUE)    │    │
│ └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│ │ 12:00-13:00 │  │ 13:00-14:00 │  │ 14:00-15:00 │    │
│ │  AVAILABLE  │  │  AVAILABLE  │  │   BOOKED    │    │
│ │   (WHITE)   │  │   (WHITE)   │  │ (GRAY/LINE) │    │
│ └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│ [Clear all selections]                                 │
└─────────────────────────────────────────────────────────┘
```

**Color Coding:**
- 🔵 **Blue with ring**: Selected slots
- ⚪ **White**: Available slots (click to select)
- ⚫ **Gray with strikethrough**: Already booked (disabled)

### Step 3: Review Booking Summary
```
┌─────────────────────────────────────────────────────────┐
│ Selected Booking                                        │
├─────────────────────────────────────────────────────────┤
│ Date: November 25, 2025                                │
│                                                         │
│ Selected Slots (3):                                    │
│ • 09:00 - 10:00                                        │
│ • 10:00 - 11:00                                        │
│ • 11:00 - 12:00                                        │
│                                                         │
│ Total: ₹3,000 (₹1,000 × 3 slots)                      │
└─────────────────────────────────────────────────────────┘
```

---

## Use Cases

### Example 1: Tennis Court Booking
**Scenario:** Want to play tennis for 2 hours

**Action:**
1. Select date: November 25, 2025
2. Click two consecutive slots:
   - 10:00 - 11:00 ✓
   - 11:00 - 12:00 ✓
3. Total: ₹2,000 (₹1,000 per hour × 2 hours)
4. Click "Book Now"

**Result:** Two separate bookings created for continuous 2-hour session

### Example 2: Meeting Room (Full Day)
**Scenario:** Need meeting room entire day

**Vendor Setup:**
1. Go to Add/Edit Product
2. Set Operating Hours
3. Click "Set Full Day (00:00 - 23:59)"
4. Save product

**Customer Booking:**
- Select date range: Nov 25 - Nov 27
- Books entire day for 3 days
- Total: ₹15,000 (₹5,000 per day × 3 days)

### Example 3: Gym Session (Multiple Non-Consecutive Slots)
**Scenario:** Morning and evening workout

**Action:**
1. Select date: November 25, 2025
2. Select morning slot: 06:00 - 07:00 ✓
3. Select evening slot: 18:00 - 19:00 ✓
4. Total: ₹1,000 (₹500 × 2 slots)

**Result:** Two bookings created for same day, different times

---

## Key Features

### ✅ What You Can Do

**Multiple Slots on Same Day:**
- Select 2, 3, 4, or more time slots
- Can be consecutive (e.g., 2-4 PM)
- Can be non-consecutive (e.g., 9 AM and 6 PM)

**Multiple Days:**
- Select date range for daily bookings
- Each day creates separate booking record
- See total cost for entire period

**Flexible Selection:**
- Click slot to select
- Click again to deselect
- "Clear all" to start over
- Change date = auto-clear slots

**Price Transparency:**
- See per-slot price
- See total price (price × slots)
- See calculation breakdown

### ❌ What You Cannot Do

**Cannot select booked slots:**
- Gray slots with strikethrough are unavailable
- Already booked by another user
- System prevents selection

**Cannot mix daily and hourly:**
- Daily products: Select date range only
- Hourly products: Select specific time slots
- Cannot combine both in one booking

---

## Technical Notes

### Time Format Standards
- **24-Hour Format**: 00:00 to 23:59
- **No AM/PM**: Uses international standard
- **Examples:**
  - Midnight: 00:00
  - 9 AM: 09:00
  - Noon: 12:00
  - 6 PM: 18:00
  - 11 PM: 23:00

### Booking Records
- **Single slot**: 1 booking record
- **Multiple slots (same day)**: N booking records (1 per slot)
- **Multiple days**: N booking records (1 per day)
- **Multiple slots × Multiple days**: N × M booking records

### Backend Storage
All times stored in database as:
- Format: `HH:mm` (24-hour)
- Start time: e.g., `09:00`
- End time: e.g., `17:00`
- No timezone conversion (future enhancement)

---

## Tips & Best Practices

### For Vendors:

1. **Set Clear Operating Hours:**
   - Business hours: 09:00 - 17:00
   - Extended hours: 08:00 - 20:00
   - 24/7 services: 00:00 - 23:59

2. **Multiple Time Ranges:**
   - Split shift: 06:00-12:00, 18:00-23:00
   - Lunch break: 09:00-13:00, 14:00-18:00

3. **Buffer Time:**
   - Set cleanup/setup time between bookings
   - Prevents back-to-back bookings
   - Ensures quality service

### For Customers:

1. **Book Multiple Slots for Longer Sessions:**
   - 2-hour tennis: Select 2 consecutive slots
   - 3-hour workshop: Select 3 consecutive slots

2. **Split Training Sessions:**
   - Morning cardio + evening strength
   - Select non-consecutive slots same day

3. **Check Availability:**
   - Gray slots = already booked
   - Plan alternate times if needed

---

## Summary

✨ **Key Improvements:**
1. ✅ Multiple slot selection for flexible booking
2. ✅ 24-hour time format for clarity
3. ✅ Full day quick-select button (00:00 - 23:59)
4. ✅ Visual feedback with color-coded slots
5. ✅ Automatic price calculation
6. ✅ Clear booking summary

🎯 **Benefits:**
- Customers: Book exactly what they need
- Vendors: Clear time management
- System: Efficient booking records
