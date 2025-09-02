# Enhanced Recommendations System with Company Search

This project now features an enhanced recommendations system that combines intelligent search suggestions with company database autocomplete functionality. The system provides context-aware recommendations based on use cases and integrates seamlessly with a local company database.

## 🚀 **New Features**

### **Company Search Integration**
- **Database Search**: Access to thousands of companies via CSV database
- **Autocomplete**: Real-time company name suggestions as you type
- **Smart Integration**: Combines company search with existing recommendation logic
- **Seamless UX**: Integrated within the existing recommendations interface

### **Enhanced Use Case Support**
- **People Search**: Find individuals with specific roles and companies
- **Recruiting**: Specialized suggestions for hiring and talent acquisition
- **Sales**: Target decision-makers and procurement contacts
- **Investor Relations**: Connect with investors and stakeholders
- **Company Research**: Comprehensive company information and insights

## 🏗️ **Architecture**

### **Components**
1. **Enhanced Recommendations** (`src/components/ui/recommendations.tsx`)
   - Original intelligent suggestion system
   - New company search integration
   - Use case templates and context awareness

2. **SearchBox Component** (`src/components/SearchBox.tsx`)
   - Company database autocomplete
   - Debounced search with loading states
   - Keyboard navigation and accessibility

3. **Company API** (`src/app/api/companies/route.ts`)
   - CSV data loading and caching
   - Fast search with case-insensitive matching
   - Memory-optimized for performance

## 📖 **Usage Examples**

### **Basic Integration**
```tsx
import Recommendations from '@/components/ui/recommendations';

function MyComponent() {
  const handleQueryPick = (query: string) => {
    console.log('Selected:', query);
    // Perform search with selected query
  };

  return (
    <Recommendations
      seedQuery="John"
      context={{ source: 'linkedin', items: results }}
      onPick={handleQueryPick}
      enableCompanySearch={true}
      useCase="people"
    />
  );
}
```

### **Advanced Configuration**
```tsx
<Recommendations
  seedQuery={searchQuery}
  context={{ source: 'linkedin', items: results }}
  onPick={handleQueryPick}
  useCase="recruiting"
  enableWebFilters={true}
  enableCompanySearch={true}
  minChars={2}
  debounceMs={120}
  maxItems={15}
  staticRoles={["CEO", "CTO", "Engineer", "Designer"]}
/>
```

## 🎯 **Use Cases & Templates**

### **People Search**
- `John CEO` → "John CEO", "John CTO", "John Founder"
- `Sarah Engineer` → "Sarah Engineer", "Sarah Developer", "Sarah at Google"

### **Recruiting**
- `John Engineer` → "John Engineer resume", "John Engineer currently hiring"
- `Sarah Designer` → "Sarah Designer remote", "Sarah Designer careers"

### **Sales**
- `John Procurement` → "John Head of Procurement", "John Decision maker"
- `Sarah Operations` → "Sarah VP Sales", "Sarah buyer at Company"

### **Investor Relations**
- `John Partner` → "John Partner", "John Principal", "John investor relations"
- `Sarah Funding` → "Sarah funding", "Sarah annual report", "Sarah 10-K"

### **Company Research**
- `Google employees` → "Google employees", "Google leadership", "Google org chart"
- `Microsoft hiring` → "Microsoft hiring", "Microsoft careers", "Microsoft benefits"

## 🔧 **Configuration Options**

### **Props**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `seedQuery` | string | - | The search query to generate recommendations for |
| `context` | object | - | Context data including source and items |
| `onPick` | function | - | Callback when a recommendation is selected |
| `useCase` | string | "people" | Use case for specialized templates |
| `enableCompanySearch` | boolean | true | Enable company database search |
| `enableWebFilters` | boolean | false | Enable site: filters for web search |
| `minChars` | number | 2 | Minimum characters before showing suggestions |
| `debounceMs` | number | 120 | Debounce delay for search |
| `maxItems` | number | 12 | Maximum number of suggestions |
| `staticRoles` | string[] | [...] | Custom role templates |

### **Use Cases**
- **`"people"`**: General people search with leadership roles
- **`"recruiting"`**: Hiring and talent acquisition focus
- **`"sales"`**: Sales prospecting and decision-maker targeting
- **`"investor"`**: Investor relations and stakeholder engagement
- **`"company"`**: Company research and organizational insights

## 🎨 **User Experience**

### **Recommendations Flow**
1. **Type Query**: Start typing (minimum 2 characters)
2. **See Suggestions**: Intelligent recommendations appear
3. **Company Search**: Click "🔍 Search company database..."
4. **Select Company**: Choose from autocomplete suggestions
5. **Combined Query**: Query combines with selected company
6. **Execute Search**: Perform search with enhanced query

### **Keyboard Navigation**
- **Arrow Keys**: Navigate through suggestions
- **Enter**: Select highlighted suggestion
- **Escape**: Close dropdowns and reset focus
- **Tab**: Move between sections

### **Visual Design**
- **Dark Theme**: Consistent with existing UI
- **Glassmorphism**: Modern backdrop blur effects
- **Smooth Animations**: Framer Motion transitions
- **Responsive Layout**: Works on all screen sizes

## 📊 **Performance Features**

### **Optimization**
- **Memory Caching**: Company names loaded once and cached
- **Debounced Search**: Prevents excessive API calls
- **Efficient Filtering**: O(n) search with early termination
- **Lazy Loading**: Components render only when needed

### **Search Algorithms**
- **Fuzzy Matching**: Handles typos and partial matches
- **Context Awareness**: Uses surrounding data for better suggestions
- **Use Case Templates**: Pre-built query patterns for efficiency
- **Smart Ranking**: Scores suggestions by relevance

## 🔍 **Company Search Features**

### **Database Integration**
- **CSV Loading**: Automatic loading from `src/data/companies.csv`
- **Memory Storage**: Fast in-memory access for all company names
- **Case Insensitive**: Finds matches regardless of capitalization
- **Partial Matching**: Shows results as you type

### **Autocomplete Features**
- **Real-time Search**: Updates as you type
- **Loading States**: Visual feedback during search
- **Error Handling**: Graceful fallbacks for issues
- **Clear Functionality**: Easy reset and restart

## 🚀 **Getting Started**

### **1. Install Dependencies**
```bash
npm install csv-parser
```

### **2. Ensure Company Data**
- Place `companies.csv` in `src/data/`
- Ensure CSV has a `name` column

### **3. Use the Component**
```tsx
import Recommendations from '@/components/ui/recommendations';

// Basic usage
<Recommendations
  seedQuery="John"
  context={{ source: 'demo', items: [] }}
  onPick={(query) => console.log(query)}
/>
```

### **4. Test the Demo**
Visit `/recommendations-demo` to see all features in action

## 🔗 **Integration Points**

### **Existing Pages**
- **LinkedIn Search**: Enhanced with company search
- **Market Analysis**: Company-specific insights
- **Competition Tracker**: Competitor research
- **Funding Trends**: Investor and company data

### **New Capabilities**
- **Company Lookup**: Find specific companies quickly
- **Role Matching**: Combine people and company searches
- **Industry Research**: Sector-specific company lists
- **Relationship Mapping**: Connect people to companies

## 🧪 **Testing & Development**

### **Demo Pages**
- **`/company-search-demo`**: Company search functionality
- **`/recommendations-demo`**: Full recommendations system

### **Development Features**
- **Hot Reload**: Changes reflect immediately
- **Error Boundaries**: Graceful error handling
- **Console Logging**: Debug information available
- **TypeScript**: Full type safety and IntelliSense

## 🔮 **Future Enhancements**

### **Planned Features**
- **Fuzzy Search**: Better typo handling
- **Company Categories**: Industry and size filtering
- **Search Analytics**: Track popular queries
- **Export Functionality**: Download search results
- **Multi-language**: International company support

### **Advanced Integrations**
- **External APIs**: Real-time company data
- **Machine Learning**: Smarter suggestion ranking
- **User Preferences**: Personalized recommendations
- **Collaboration**: Shared search queries

## 📚 **API Reference**

### **Company Search API**
```
GET /api/companies?q={query}
Response: { companies: string[], total: number, query: string }
```

### **Recommendations Component**
```tsx
interface RecommendationsProps {
  seedQuery: string;
  context: { source: string; items: any[] };
  onPick: (query: string) => void;
  useCase?: "people" | "recruiting" | "sales" | "investor" | "company";
  enableCompanySearch?: boolean;
  enableWebFilters?: boolean;
  // ... other props
}
```

## 🤝 **Contributing**

### **Code Style**
- **TypeScript**: Strict type checking enabled
- **ESLint**: Consistent code formatting
- **Prettier**: Automatic code formatting
- **Component Pattern**: Reusable, composable components

### **Testing Strategy**
- **Component Testing**: Individual component validation
- **Integration Testing**: End-to-end functionality
- **Performance Testing**: Load and response time validation
- **Accessibility Testing**: Screen reader and keyboard support

## 📄 **License**

This enhanced recommendations system is part of the youtube-summary project and follows the same licensing terms.

---

**Ready to enhance your search experience?** The enhanced recommendations system combines the best of intelligent suggestions with powerful company search capabilities, creating a seamless and powerful search interface for your users.
