# Expandable Documentation Sidebar

A comprehensive, interactive documentation sidebar component for Next.js applications that provides contextual help, tips, and guidance to users.

## Features

### 🎯 **Core Functionality**
- **Expandable Sections**: Click to expand/collapse documentation sections
- **Page-Specific Content**: Different documentation based on current page
- **Search Functionality**: Find specific topics quickly
- **Collapsible Sidebar**: Minimize to save screen space
- **Responsive Design**: Works on all screen sizes

### 🎨 **UI Components**
- **Section Headers**: Clear titles with relevant icons
- **Content Cards**: Organized information with visual hierarchy
- **Quick Actions**: Interactive buttons for common tasks
- **Search Input**: Real-time filtering of documentation
- **Collapse/Expand**: Smooth animations and transitions

### 📱 **User Experience**
- **Contextual Help**: Relevant information for each page
- **Progressive Disclosure**: Show only what users need
- **Visual Feedback**: Hover states and active indicators
- **Keyboard Accessible**: Proper focus management
- **Mobile Friendly**: Responsive design patterns

## Implementation

### 1. Component Structure

```tsx
// src/components/ui/expandable-docs-sidebar.tsx
export const ExpandableDocsSidebar = ({ 
  className, 
  currentPage 
}: ExpandableDocsSidebarProps) => {
  // State management for expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["getting-started"])
  );
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  
  // Collapsible sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // ... component logic
};
```

### 2. State Management

The component uses three main state variables:

- **`expandedSections`**: Tracks which sections are currently expanded
- **`searchQuery`**: Stores the current search term
- **`isCollapsed`**: Controls sidebar collapse state

```tsx
// Toggle section expansion
const toggleSection = (sectionId: string) => {
  const newExpanded = new Set(expandedSections);
  if (newExpanded.has(sectionId)) {
    newExpanded.delete(sectionId);
  } else {
    newExpanded.add(sectionId);
  }
  setExpandedSections(newExpanded);
};

// Check if section is expanded
const isExpanded = (sectionId: string) => expandedSections.has(sectionId);
```

### 3. Content Organization

Documentation is organized into sections with:

```tsx
interface DocSection {
  id: string;           // Unique identifier
  title: string;        // Section title
  icon: React.ReactNode; // Lucide React icon
  content: React.ReactNode; // Section content
  defaultExpanded?: boolean; // Auto-expand on load
}
```

### 4. Page-Specific Content

Different pages show relevant documentation:

```tsx
const getPageSpecificSections = (): DocSection[] => {
  const commonSections = [
    // Shared across all pages
  ];
  
  const pageSpecificSections = {
    youtube: [
      // YouTube-specific documentation
    ],
    article: [
      // Article analysis documentation
    ],
    linkedin: [
      // LinkedIn research documentation
    ],
  };
  
  return [...commonSections, ...(pageSpecificSections[currentPage] || [])];
};
```

## Usage

### Basic Implementation

```tsx
import { ExpandableDocsSidebar } from "@/components/ui/expandable-docs-sidebar";

export default function MyPage() {
  return (
    <div className="flex gap-6">
      <ExpandableDocsSidebar currentPage="youtube" />
      <div className="flex-1">
        {/* Your main content */}
      </div>
    </div>
  );
}
```

### With Custom Styling

```tsx
<ExpandableDocsSidebar 
  currentPage="article"
  className="w-96 bg-gray-900" // Custom width and background
/>
```

### In Layout Components

```tsx
// src/app/market_analysis/layout.tsx
export default function MarketAnalysisLayout({ children }) {
  const pathname = usePathname();
  
  return (
    <div className="flex gap-6">
      <ExpandableDocsSidebar 
        currentPage={
          pathname.includes('/youtube') ? 'youtube' : 
          pathname.includes('/article') ? 'article' : 
          pathname.includes('/linkedin') ? 'linkedin' : 
          'youtube'
        }
      />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
```

## Customization

### 1. Adding New Sections

```tsx
const newSection: DocSection = {
  id: "custom-feature",
  title: "Custom Feature",
  icon: <CustomIcon className="w-4 h-4" />,
  content: (
    <div className="space-y-3 text-sm">
      <p className="text-white/70">
        Your custom content here...
      </p>
    </div>
  ),
};

// Add to your sections array
const sections = [...existingSections, newSection];
```

### 2. Custom Icons

Use any Lucide React icon or custom SVG:

```tsx
import { 
  BookOpen, 
  Lightbulb, 
  HelpCircle, 
  Target,
  TrendingUp,
  Users 
} from "lucide-react";

// Or custom icons
const CustomIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    {/* Your SVG path */}
  </svg>
);
```

### 3. Styling Customization

The component uses Tailwind CSS classes that can be overridden:

```tsx
// Custom background and borders
<div className="bg-gradient-to-br from-blue-900 to-purple-900 border-blue-500/30">
  <ExpandableDocsSidebar />
</div>

// Custom sidebar width
<ExpandableDocsSidebar className="w-96" />
```

### 4. Content Types

Support various content types:

```tsx
// Text content
content: <p className="text-white/70">Simple text content</p>

// Lists
content: (
  <ul className="space-y-2 text-white/70">
    <li>• List item 1</li>
    <li>• List item 2</li>
  </ul>
)

// Interactive elements
content: (
  <div className="space-y-2">
    <button className="w-full p-2 bg-blue-500/20 rounded-lg">
      Interactive Button
    </button>
  </div>
)

// Rich content with cards
content: (
  <div className="space-y-2">
    <div className="p-2 bg-white/5 rounded-lg">
      <p className="text-white/80 font-medium">Card Title</p>
      <p className="text-white/60 text-xs">Card description</p>
    </div>
  </div>
)
```

## Advanced Features

### 1. Search Functionality

```tsx
// Filter sections based on search query
const filteredSections = useMemo(() => {
  if (!searchQuery.trim()) return sections;
  
  return sections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (section.content && section.content.toString().toLowerCase().includes(searchQuery.toLowerCase()))
  );
}, [sections, searchQuery]);
```

### 2. Collapsible Sidebar

```tsx
// Collapsed state shows only icons
if (isCollapsed) {
  return (
    <div className="w-16 bg-white/[0.03] border-r border-white/[0.1]">
      <button onClick={() => setIsCollapsed(false)}>
        <ChevronRight className="w-5 h-5" />
      </button>
      {/* Icon-only navigation */}
    </div>
  );
}
```

### 3. Responsive Design

```tsx
// Mobile-friendly sidebar
<div className={cn(
  "w-80 bg-white/[0.03] border-r border-white/[0.1] backdrop-blur-lg",
  "md:block", // Show on medium screens and up
  "hidden",   // Hide on small screens
  className
)}>
```

## Integration Examples

### 1. Market Analysis Pages

```tsx
// YouTube Summarizer
<ExpandableDocsSidebar currentPage="youtube" />

// Article Analysis
<ExpandableDocsSidebar currentPage="article" />

// LinkedIn Research
<ExpandableDocsSidebar currentPage="linkedin" />
```

### 2. Dashboard Layouts

```tsx
// Main dashboard with sidebar
<div className="flex h-screen">
  <ExpandableDocsSidebar currentPage="dashboard" />
  <main className="flex-1 overflow-auto">
    {/* Dashboard content */}
  </main>
</div>
```

### 3. Multi-Page Applications

```tsx
// Dynamic page detection
const getCurrentPage = (pathname: string) => {
  if (pathname.includes('/products')) return 'products';
  if (pathname.includes('/analytics')) return 'analytics';
  if (pathname.includes('/settings')) return 'settings';
  return 'default';
};

<ExpandableDocsSidebar currentPage={getCurrentPage(pathname)} />
```

## Best Practices

### 1. Content Organization

- **Group related information** into logical sections
- **Use clear, descriptive titles** for each section
- **Keep content concise** and actionable
- **Provide examples** where possible

### 2. User Experience

- **Default to most important sections** expanded
- **Use consistent iconography** throughout
- **Provide visual hierarchy** with spacing and typography
- **Include interactive elements** for engagement

### 3. Performance

- **Memoize filtered sections** to avoid unnecessary re-renders
- **Use lazy loading** for heavy content
- **Optimize images and icons** for fast loading
- **Implement proper cleanup** for event listeners

### 4. Accessibility

- **Use semantic HTML** for proper screen reader support
- **Provide keyboard navigation** for all interactive elements
- **Include proper ARIA labels** for complex interactions
- **Ensure sufficient color contrast** for readability

## Troubleshooting

### Common Issues

1. **Sections not expanding**: Check if `expandedSections` state is properly managed
2. **Search not working**: Verify `searchQuery` state and filtering logic
3. **Styling conflicts**: Ensure Tailwind CSS classes are properly imported
4. **Performance issues**: Check for unnecessary re-renders and optimize with `useMemo`

### Debug Tips

```tsx
// Add console logs for debugging
console.log('Current sections:', sections);
console.log('Filtered sections:', filteredSections);
console.log('Expanded sections:', expandedSections);
console.log('Search query:', searchQuery);
```

## Future Enhancements

### Planned Features

- **Bookmarking**: Save frequently accessed sections
- **History tracking**: Remember user preferences
- **Export functionality**: Save documentation as PDF/HTML
- **Multi-language support**: Internationalization
- **Analytics**: Track user interaction patterns
- **Custom themes**: User-defined color schemes

### Extension Points

The component is designed to be easily extensible:

- **Plugin system** for additional content types
- **Custom renderers** for specialized content
- **Integration hooks** for external data sources
- **Event system** for custom interactions

## Conclusion

The Expandable Documentation Sidebar provides a powerful, flexible way to deliver contextual help and guidance to users. With its modular design, comprehensive feature set, and easy customization options, it can enhance any Next.js application's user experience.

By following the implementation patterns and best practices outlined in this document, you can create engaging, informative documentation that helps users get the most out of your application.
