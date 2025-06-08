# Booking UI Components Documentation

## Overview
The SmartQ2 booking system includes three main UI components that work together to provide a complete appointment booking experience: Calendar, TimeSlotPicker, and BookingForm.

## Components

### 1. Calendar Component

A fully-featured calendar component for date selection with business rule validation.

#### Props
```typescript
interface CalendarProps {
  selectedDate?: Date              // Currently selected date
  onDateSelect: (date: Date) => void  // Callback when date is selected
  minDate?: Date                   // Minimum selectable date (default: today)
  maxDate?: Date                   // Maximum selectable date (default: 3 months out)
  disableWeekends?: boolean        // Whether to disable weekend selection
  className?: string               // Additional CSS classes
}
```

#### Features
- **Navigation**: Previous/next month navigation with boundary checking
- **Visual Indicators**: Today highlighting, selected date highlighting, disabled dates
- **Business Rules**: Automatic enforcement of min/max dates
- **Responsive Design**: Mobile-friendly grid layout
- **Accessibility**: Full keyboard navigation and screen reader support

#### Usage Example
```tsx
import { Calendar } from '@/components/Calendar'

function MyComponent() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  return (
    <Calendar
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
      minDate={new Date()}
      disableWeekends={false}
    />
  )
}
```

### 2. TimeSlotPicker Component

A time slot selection component that displays available appointment times in 15-minute intervals.

#### Props
```typescript
interface TimeSlotPickerProps {
  selectedDate: Date | null        // Date for which to show time slots
  selectedTime: string | null      // Currently selected time (HH:MM format)
  onTimeSelect: (time: string) => void  // Callback when time is selected
  className?: string               // Additional CSS classes
}
```

#### Features
- **Business Hours**: Automatic 9 AM - 5 PM time slot generation
- **15-Minute Intervals**: Standard appointment duration slots
- **Availability Checking**: Real-time availability validation
- **Visual States**: Available, booked, disabled, and selected states
- **Time Grouping**: Morning and afternoon time slot organization
- **Loading States**: Spinner during availability checks

#### Usage Example
```tsx
import { TimeSlotPicker } from '@/components/TimeSlotPicker'

function MyComponent() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  
  return (
    <TimeSlotPicker
      selectedDate={selectedDate}
      selectedTime={selectedTime}
      onTimeSelect={setSelectedTime}
    />
  )
}
```

### 3. BookingForm Component

A comprehensive multi-step booking form that combines all booking functionality.

#### Props
```typescript
interface BookingFormProps {
  onBookingComplete?: (booking: BookingResult) => void  // Success callback
  className?: string                                    // Additional CSS classes
}
```

#### Features
- **Multi-Step Process**: 3-step wizard (Info → Date/Time → Confirm)
- **Form Validation**: Real-time validation with error messages
- **API Integration**: Direct integration with `/api/book` endpoint
- **Progress Indicator**: Visual step progress with completion states
- **Error Handling**: Comprehensive error display and retry mechanisms
- **Loading States**: Button loading states during submission

#### Usage Example
```tsx
import { BookingForm } from '@/components/BookingForm'

function BookingPage() {
  const handleBookingComplete = (result: BookingResult) => {
    console.log('Booking successful:', result)
    // Handle success (redirect, show confirmation, etc.)
  }
  
  return (
    <BookingForm onBookingComplete={handleBookingComplete} />
  )
}
```

## Integration Guide

### Basic Integration

The simplest way to add booking functionality is to use the complete BookingForm component:

```tsx
// app/book/page.tsx
import { BookingForm } from '@/components/BookingForm'

export default function BookPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Book Appointment</h1>
      <BookingForm />
    </div>
  )
}
```

### Custom Integration

For more control, you can use individual components:

```tsx
import { Calendar, TimeSlotPicker } from '@/components'

export default function CustomBookingPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Calendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
      <TimeSlotPicker
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onTimeSelect={setSelectedTime}
      />
    </div>
  )
}
```

## Styling and Customization

### CSS Classes

All components use Tailwind CSS classes and accept a `className` prop for customization:

```tsx
<Calendar className="shadow-lg border-2 border-blue-200" />
<TimeSlotPicker className="bg-gray-50" />
<BookingForm className="max-w-3xl" />
```

### Theme Support

Components are designed to work with both light and dark themes:

```css
/* Custom theme variables */
:root {
  --booking-primary: #3b82f6;
  --booking-primary-hover: #2563eb;
  --booking-success: #10b981;
  --booking-warning: #f59e0b;
  --booking-error: #ef4444;
}
```

## API Integration

### Booking API Endpoint

The BookingForm component integrates with the `/api/book` endpoint:

```typescript
// Expected request format
{
  name: string
  phone?: string
  email?: string
  date: string     // YYYY-MM-DD
  time: string     // HH:MM
}

// Expected response format
{
  success: boolean
  appointment?: {
    ticketId: string
    scheduledTime: string
    date: string
    time: string
    status: string
  }
  user?: {
    name: string
    phone: string
    email: string
  }
  queue?: {
    current: any[]
    nowServing: string | null
    totalAhead: number
  }
  instructions?: {
    checkIn: string
    late: string
    contact: string
  }
  message?: string
  error?: string
}
```

### Error Handling

Components handle various error scenarios:
- **Network Errors**: Connection issues, timeouts
- **Validation Errors**: Invalid input data
- **Business Logic Errors**: Time slot conflicts, past dates
- **API Errors**: Server-side errors from booking endpoint

## Testing

### Component Testing

Test each component individually:

```tsx
// Visit /test-components to see all components in action
// This page demonstrates:
// - Complete booking flow
// - Success/error states
// - API integration
// - Responsive design
```

### Manual Testing Scenarios

1. **Date Selection**:
   - Navigate between months
   - Select valid/invalid dates
   - Test weekend disabling

2. **Time Selection**:
   - Select available times
   - Verify booked slots are disabled
   - Test past time filtering

3. **Form Validation**:
   - Submit with missing fields
   - Test email/phone validation
   - Verify contact requirement (phone OR email)

4. **Booking Flow**:
   - Complete end-to-end booking
   - Test error scenarios
   - Verify success handling

## Performance Considerations

### Optimization Features

- **Lazy Loading**: Components only render when needed
- **Memoization**: Date calculations are memoized
- **Debounced API Calls**: Availability checks are optimized
- **Error Boundaries**: Graceful error handling

### Best Practices

- Use React.memo for expensive calculations
- Implement proper loading states
- Cache availability data when possible
- Optimize re-renders with proper dependency arrays

## Accessibility

### Features Included

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus indicators
- **Color Contrast**: WCAG compliant color schemes
- **Error Announcements**: Screen reader friendly error messages

### ARIA Labels

```tsx
// Calendar accessibility
<button aria-label={`Select ${date.toLocaleDateString()}`}>
  
// Time slot accessibility  
<button aria-label={`${slot.label} ${slot.available ? 'available' : 'booked'}`}>

// Form accessibility
<input aria-describedby="name-error" aria-invalid={!!errors.name}>
```

## Mobile Responsiveness

### Breakpoints

- **Mobile (< 640px)**: Single column layout, touch-optimized buttons
- **Tablet (640px - 1024px)**: Responsive grid, larger touch targets
- **Desktop (> 1024px)**: Full side-by-side layout, hover states

### Touch Optimization

- Minimum 44px touch targets
- Proper spacing between interactive elements
- Swipe gesture support for calendar navigation
- Mobile-friendly form inputs

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript Required**: Components require JavaScript to function
- **Progressive Enhancement**: Graceful degradation for limited environments 