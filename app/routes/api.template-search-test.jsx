import { json } from "@remix-run/node";

// Simple test endpoint for template search without authentication
export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("q") || "";
    const category = url.searchParams.get("category") || "all";
    const sortBy = url.searchParams.get("sort") || "name";
    const sortOrder = url.searchParams.get("order") || "asc";

    // Mock template data for testing
    const mockTemplates = [
      { id: 1, name: "Exit Intent Classic", category: "exit-intent", description: "Classic exit popup" },
      { id: 2, name: "Flash Sale Banner", category: "sales", description: "Limited time flash sale" },
      { id: 3, name: "Holiday Special", category: "holiday", description: "Christmas holiday special" },
      { id: 4, name: "Newsletter Signup", category: "newsletter", description: "Email capture popup" },
      { id: 5, name: "Exit Discount", category: "exit-intent", description: "Exit intent with discount" }
    ];

    // Filter by search query
    let filteredTemplates = mockTemplates;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredTemplates = mockTemplates.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (category !== "all") {
      filteredTemplates = filteredTemplates.filter(template => template.category === category);
    }

    // Sort templates
    filteredTemplates.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Generate suggestions for empty results
    const suggestions = filteredTemplates.length === 0 && searchQuery ? 
      mockTemplates
        .filter(t => t.name.toLowerCase().includes(searchQuery.substring(0, 3)))
        .map(t => t.name)
        .slice(0, 3) : [];

    return json({
      success: true,
      templates: filteredTemplates,
      totalCount: filteredTemplates.length,
      searchQuery,
      category,
      sortBy,
      sortOrder,
      suggestions
    });

  } catch (error) {
    console.error("Template search test error:", error);
    return json({ 
      success: false, 
      error: "Internal server error",
      templates: [],
      totalCount: 0
    }, { status: 500 });
  }
};
