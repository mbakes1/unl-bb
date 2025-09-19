# Centralized Frontend Filter State Management

## Summary

We have successfully refactored the filter state management on the main page to use a centralized approach with `useReducer`, eliminating the fragmented state logic and making the component simpler and more maintainable.

## Key Changes

### 1. Centralized State Management
- Replaced multiple individual `useState` hooks with a single `useReducer` for all filter state
- Created a `FilterState` type to define the structure of the filter state
- Implemented a `filterReducer` function to handle all state transitions

### 2. Action-Based State Updates
- Defined `FilterAction` types for all possible state changes:
  - `SET_SEARCH_QUERY`
  - `SET_DATE_FROM`
  - `SET_DATE_TO`
  - `SET_PAGE_SIZE`
  - `SET_INDUSTRY_FILTER`
  - `SET_CURRENT_PAGE`
  - `RESET_FILTERS`
  - `APPLY_FILTERS`
- Created a centralized `handleFilterChange` function that dispatches actions and updates URL parameters

### 3. Simplified Component Interface
- Updated `SearchAndFiltersHeader` component to accept an `onResetFilters` prop
- Removed individual handler functions in favor of a single dispatch mechanism
- Maintained all existing functionality while simplifying the component interface

### 4. URL as Single Source of Truth
- Preserved the existing behavior where URL parameters are the single source of truth
- The reducer initializes state from URL parameters
- All state changes are reflected in the URL

## Benefits

### 1. Improved Maintainability
- All filter state logic is now centralized in one place
- Adding new filters requires minimal changes to the reducer
- State transitions are predictable and easy to trace

### 2. Reduced Complexity
- Eliminated multiple individual handler functions
- Removed repetitive code patterns
- Simplified component interface

### 3. Better Performance
- State updates are batched through the reducer
- Reduced re-renders by consolidating related state changes
- Maintained existing debouncing behavior for search queries

### 4. Enhanced Developer Experience
- Clearer state management pattern
- Type-safe action definitions
- Easier to test and debug

## Technical Details

The refactored implementation uses React's `useReducer` hook to manage all filter state:

```typescript
// Filter state type
interface FilterState {
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  pageSize: number;
  industryFilter: string;
  currentPage: number;
}

// Action types
type FilterAction =
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_DATE_FROM"; payload: string }
  | { type: "SET_DATE_TO"; payload: string }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_INDUSTRY_FILTER"; payload: string }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "RESET_FILTERS" }
  | { type: "APPLY_FILTERS" };

// Reducer function
function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload, currentPage: 1 };
    // ... other cases
  }
}
```

The centralized `handleFilterChange` function dispatches actions and updates URL parameters:

```typescript
const handleFilterChange = useCallback(
  (action: FilterAction) => {
    dispatch(action);
    
    // Update URL based on the action type
    switch (action.type) {
      case "SET_SEARCH_QUERY":
        updateUrlParams({ search: action.payload, page: 1 });
        break;
      // ... other cases
    }
  },
  [updateUrlParams]
);
```

## Verification

- All filtering functionality remains unchanged from the user's perspective
- URL parameters continue to be the single source of truth
- TypeScript compilation and Next.js build both pass without errors
- Existing debounce behavior for search queries is preserved
- Reset filters functionality works correctly
- Pagination and all filter interactions work as expected