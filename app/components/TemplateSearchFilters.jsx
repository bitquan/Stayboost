import {
    BlockStack,
    Button,
    ButtonGroup,
    Icon,
    InlineStack,
    Select,
    Tag,
    Text,
    TextField,
    Tooltip
} from '@shopify/polaris';
import {
    FilterIcon,
    SearchIcon,
    SortAscendingIcon,
    SortDescendingIcon,
    XIcon
} from '@shopify/polaris-icons';
import { useCallback, useEffect, useState } from 'react';

export function TemplateSearchFilters({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  templateType,
  onTemplateTypeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
  totalResults,
  loading,
  suggestions = []
}) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        onSearchChange(localSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery, onSearchChange]);

  // Update local search when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const categoryOptions = [
    { label: 'All Categories', value: 'all' },
    { label: '⭐ My Favorites', value: 'favorites' },
    { label: 'Exit Intent', value: 'exit-intent' },
    { label: 'Sales', value: 'sales' },
    { label: 'Holiday', value: 'holiday' },
    { label: 'Newsletter', value: 'newsletter' },
    { label: 'Seasonal', value: 'seasonal' },
    { label: 'Events', value: 'events' },
    { label: 'Spring', value: 'spring' },
    { label: 'Summer', value: 'summer' },
    { label: 'Fall', value: 'fall' },
    { label: 'Winter', value: 'winter' },
    { label: 'Black Friday', value: 'black-friday' },
    { label: 'Cyber Monday', value: 'cyber-monday' },
    { label: 'Valentine\'s Day', value: 'valentines' },
    { label: 'Mother\'s Day', value: 'mothers-day' },
    { label: 'Father\'s Day', value: 'fathers-day' },
    { label: 'Back to School', value: 'back-to-school' },
    { label: 'New Year', value: 'new-year' },
    { label: 'Birthday', value: 'birthday' },
    { label: 'Flash Sale', value: 'flash-sale' },
    { label: 'Clearance', value: 'clearance' }
  ];

  const templateTypeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'Built-in Templates', value: 'builtin' },
    { label: 'Custom Templates', value: 'custom' }
  ];

  const sortOptions = [
    { label: 'Name', value: 'name' },
    { label: 'Date Created', value: 'created' },
    { label: 'Last Updated', value: 'updated' },
    { label: 'Usage Count', value: 'usage' },
    { label: 'Rating', value: 'rating' },
    { label: 'Conversion Rate', value: 'conversion' }
  ];

  const hasActiveFilters = searchQuery || category !== 'all' || templateType !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  const handleSuggestionClick = useCallback((suggestion) => {
    setLocalSearchQuery(suggestion);
    onSearchChange(suggestion);
  }, [onSearchChange]);

  const toggleSortOrder = useCallback(() => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, onSortOrderChange]);

  return (
    <BlockStack gap="4">
      {/* Main Search Bar */}
      <InlineStack gap="4" align="space-between">
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <TextField
            value={localSearchQuery}
            onChange={setLocalSearchQuery}
            placeholder="Search templates by name, category, or description..."
            prefix={<Icon source={SearchIcon} />}
            suffix={
              localSearchQuery && (
                <Button
                  icon={XIcon}
                  variant="plain"
                  onClick={() => {
                    setLocalSearchQuery('');
                    onSearchChange('');
                  }}
                  accessibilityLabel="Clear search"
                />
              )
            }
            autoComplete="off"
            disabled={loading}
          />
        </div>

        <InlineStack gap="2">
          <Button
            icon={FilterIcon}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            variant={showAdvancedFilters ? 'primary' : 'secondary'}
            size="medium"
          >
            Filters
          </Button>
          
          {hasActiveFilters && (
            <Button
              onClick={onClearFilters}
              variant="tertiary"
              size="medium"
            >
              Clear All
            </Button>
          )}
        </InlineStack>
      </InlineStack>

      {/* Search Suggestions */}
      {suggestions.length > 0 && searchQuery && (
        <InlineStack gap="2">
          <Text variant="bodySm" color="subdued">
            Did you mean:
          </Text>
          {suggestions.map((suggestion, index) => (
            <Tag
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Tag>
          ))}
        </InlineStack>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <InlineStack gap="4" wrap>
          <div style={{ minWidth: '200px' }}>
            <Select
              label="Category"
              options={categoryOptions}
              value={category}
              onChange={onCategoryChange}
              disabled={loading}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <Select
              label="Template Type"
              options={templateTypeOptions}
              value={templateType}
              onChange={onTemplateTypeChange}
              disabled={loading}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <Select
              label="Sort By"
              options={sortOptions}
              value={sortBy}
              onChange={onSortByChange}
              disabled={loading}
            />
          </div>

          <div style={{ minWidth: '120px' }}>
            <ButtonGroup segmented>
              <Tooltip content={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}>
                <Button
                  icon={sortOrder === 'asc' ? SortAscendingIcon : SortDescendingIcon}
                  onClick={toggleSortOrder}
                  variant="secondary"
                  disabled={loading}
                />
              </Tooltip>
            </ButtonGroup>
          </div>
        </InlineStack>
      )}

      {/* Results Summary */}
      <InlineStack gap="2" align="space-between">
        <Text variant="bodySm" color="subdued">
          {loading ? 'Searching...' : `${totalResults || 0} template${totalResults === 1 ? '' : 's'} found`}
        </Text>
        
        {hasActiveFilters && (
          <InlineStack gap="2">
            {searchQuery && (
              <Tag onRemove={() => onSearchChange('')}>
                Search: {searchQuery}
              </Tag>
            )}
            {category !== 'all' && (
              <Tag onRemove={() => onCategoryChange('all')}>
                Category: {categoryOptions.find(opt => opt.value === category)?.label}
              </Tag>
            )}
            {templateType !== 'all' && (
              <Tag onRemove={() => onTemplateTypeChange('all')}>
                Type: {templateTypeOptions.find(opt => opt.value === templateType)?.label}
              </Tag>
            )}
            {sortBy !== 'name' && (
              <Tag onRemove={() => onSortByChange('name')}>
                Sort: {sortOptions.find(opt => opt.value === sortBy)?.label} ({sortOrder})
              </Tag>
            )}
          </InlineStack>
        )}
      </InlineStack>
    </BlockStack>
  );
}
