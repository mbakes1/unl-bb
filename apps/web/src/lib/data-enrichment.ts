// /apps/web/src/lib/data-enrichment.ts

export const INDUSTRY_CATEGORIES: Record<string, string[]> = {
  'Construction & Engineering': ['construction', 'civil', 'road', 'building', 'engineer', 'electrical', 'maintenance', 'plumbing', 'structural'],
  'Information Technology': ['software', 'hardware', 'it', 'ict', 'network', 'data', 'cybersecurity', 'development', 'website'],
  'Healthcare & Medical': ['medical', 'health', 'pharmaceutical', 'hospital', 'clinic', 'surgical', 'ppe'],
  'Professional Services': ['consulting', 'advisory', 'legal', 'audit', 'training', 'research', 'accounting', 'human resources'],
  'Security Services': ['security', 'guarding', 'surveillance', 'cctv', 'access control'],
  'Transportation & Logistics': ['transport', 'logistics', 'fleet', 'vehicle', 'courier', 'freight', 'supply chain', 'distribution', 'warehousing'],
  'Agriculture & Environmental': ['agriculture', 'farming', 'forestry', 'irrigation', 'environmental', 'waste management'],
  'Catering & Accommodation': ['catering', 'accommodation', 'events', 'hospitality'],
  'General Supplies & Goods': ['supply of', 'delivery of', 'goods', 'equipment', 'materials', 'stationery', 'consumables'],
  'Cleaning & Hygiene': ['cleaning', 'hygiene', 'sanitation', 'janitorial', 'waste removal'],
  'Marketing & Communications': ['marketing', 'advertising', 'branding', 'communications', 'public relations', 'media'],
};

export function extractIndustry(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(INDUSTRY_CATEGORIES)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return category;
      }
    }
  }
  
  return null;
}

export function extractProvince(title: string): string | null {
  const provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
    'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
  ];
  
  for (const province of provinces) {
    if (title.includes(province)) {
      return province;
    }
  }
  
  return null;
}