# Company Search Autocomplete Feature

This project implements a complete autocomplete feature for company names using a local CSV dataset. The feature includes both backend API endpoints and a reusable frontend component.

## Features

- **Real-time Search**: Debounced search with 300ms delay for optimal performance
- **Case-insensitive Matching**: Searches through company names regardless of case
- **Keyboard Navigation**: Full keyboard support (arrow keys, Enter, Escape)
- **Smart Dropdown**: Auto-closes when clicking outside, shows loading states
- **Responsive Design**: Built with TailwindCSS for modern, beautiful UI
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance Optimized**: In-memory storage with efficient filtering

## Installation

1. **Install Dependencies**
   ```bash
   npm install csv-parser
   ```

2. **Ensure CSV File Location**
   - Place your `companies.csv` file in `src/data/companies.csv`
   - The CSV should have a column named `name` containing company names

## File Structure

```
src/
├── app/
│   └── api/
│       └── companies/
│           └── route.ts          # Backend API endpoint
├── components/
│   └── SearchBox.tsx            # Reusable search component
└── app/
    └── company-search-demo/
        └── page.tsx             # Demo page showcasing the component
```

## Backend API

### Endpoint: `/api/companies`

**Method**: GET  
**Query Parameters**: 
- `q` (required): Search query string

**Response**:
```json
{
  "companies": ["Company Name 1", "Company Name 2"],
  "total": 2,
  "query": "search term"
}
```

**Features**:
- Automatically loads CSV data on startup
- Stores company names in memory for fast access
- Returns up to 10 matching results
- Case-insensitive search
- Error handling for file reading issues

## Frontend Component

### SearchBox Component

**Props**:
- `placeholder` (optional): Input placeholder text
- `onCompanySelect` (optional): Callback when a company is selected
- `className` (optional): Additional CSS classes
- `initialValue` (optional): Initial input value

**Usage**:
```tsx
import SearchBox from '@/components/SearchBox';

function MyComponent() {
  const handleCompanySelect = (companyName: string) => {
    console.log('Selected:', companyName);
  };

  return (
    <SearchBox
      placeholder="Search companies..."
      onCompanySelect={handleCompanySelect}
      className="w-full max-w-md"
    />
  );
}
```

**Features**:
- Debounced search (300ms delay)
- Loading indicators
- Error handling and display
- Keyboard navigation support
- Click outside to close dropdown
- Clear button functionality
- Responsive design

## Demo Page

Visit `/company-search-demo` to see the component in action with:
- Interactive search functionality
- Feature showcase
- Usage examples

## Implementation Details

### Backend (route.ts)
- Uses `fs` and `csv-parser` to read CSV data
- Loads data into memory on startup for performance
- Implements efficient filtering with case-insensitive search
- Returns paginated results (max 10)

### Frontend (SearchBox.tsx)
- React hooks for state management
- Debounced API calls to prevent excessive requests
- Keyboard event handling for accessibility
- Click outside detection for better UX
- Loading states and error handling
- TailwindCSS for styling

## Performance Considerations

- **Memory Usage**: Company names are loaded once and stored in memory
- **Search Performance**: O(n) filtering with early termination at 10 results
- **API Calls**: Debounced to prevent excessive requests
- **CSV Loading**: Async loading with error handling

## Customization

### Styling
The component uses TailwindCSS classes that can be easily customized:
- Modify colors by changing color classes (e.g., `bg-blue-500` → `bg-green-500`)
- Adjust spacing with spacing utilities
- Change border radius, shadows, and other visual properties

### Behavior
- Adjust debounce delay in the `useEffect` hook
- Modify the maximum number of results in the API
- Add additional filtering logic in the backend
- Implement caching strategies for larger datasets

## Troubleshooting

### Common Issues

1. **CSV Not Loading**
   - Check file path: `src/data/companies.csv`
   - Ensure CSV has a `name` column
   - Check console for file reading errors

2. **Search Not Working**
   - Verify API endpoint is accessible
   - Check browser console for API errors
   - Ensure `csv-parser` is installed

3. **Styling Issues**
   - Verify TailwindCSS is properly configured
   - Check for CSS conflicts in parent components

### Debug Mode
Add console logs in the component to debug:
```tsx
console.log('Search query:', query);
console.log('API response:', data);
```

## Future Enhancements

- **Caching**: Implement Redis or similar for larger datasets
- **Fuzzy Search**: Add fuzzy matching for typos
- **Categories**: Support for company categories/industries
- **Analytics**: Track search patterns and popular queries
- **Export**: Allow exporting search results
- **Multi-language**: Support for international company names

## License

This component is part of the youtube-summary project and follows the same licensing terms.
