export function getSlugFromName(name: string): string {
    const overrides: Record<string, string> = {
      "Main (Gardner) Stacks": "main_stacks",
      "Main Stacks": "main_stacks",
      "Moffitt Library": "moffitt",
      "Doe Library": "doe",
      "Kresge Engineering Library": "kresge",
      "Engineering & Mathematical Sciences Library": "kresge"
    };
  
    if (overrides[name]) return overrides[name];
  
    return name
      .toLowerCase()
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^\w_]/g, ''); // Remove special chars
  }