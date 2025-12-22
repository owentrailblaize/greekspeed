import { industries } from './alumniConstants';

/**
 * Maps free-text industry input to the closest matching preset industry
 * This handles existing free-text data in the database
 */
export function normalizeIndustry(industryInput: string | null | undefined): string | null {
  if (!industryInput) return null;
  
  const normalized = industryInput.trim();
  if (!normalized) return null;
  
  // Exact match (case-insensitive) - handles "Technology" vs "technology"
  const exactMatch = industries.find(
    ind => ind.toLowerCase() === normalized.toLowerCase()
  );
  if (exactMatch) return exactMatch;
  
  // Fuzzy matching for common variations (handles existing free-text data)
  const lowerInput = normalized.toLowerCase();
  
  // Technology variations - comprehensive coverage
  if (['tech', 'technology', 'technologies', 'software', 'it', 'information technology', 
       'information tech', 'ict', 'computer science', 'computer engineering', 'tech industry', 
       'software development', 'software engineering', 'tech sector', 'tech field',
       'programming', 'coding', 'developer', 'development', 'saas', 'cloud computing',
       'data science', 'ai', 'artificial intelligence', 'machine learning', 'cybersecurity',
       'information security', 'digital', 'digital technology', 'web development',
       'app development', 'devops', 'systems', 'tech services', 'tech solutions',
       'information systems', 'enterprise software', 'fintech', 'edtech', 'healthtech',
       'legaltech', 'proptech', 'insurtech', 'martech', 'adtech', 'hrtech', 'retailtech',
       'agtech', 'biotech', 'medtech', 'cleantech', 'greentech', 'blockchain', 'crypto',
       'iot', 'internet of things', 'vr', 'virtual reality', 'ar', 'augmented reality',
       'gaming', 'game development', 'robotics', 'automation', 'quantum computing',
       'nanotechnology', '3d printing', 'big data', 'data analytics', 'business intelligence',
       'analytics', 'tech startup', 'tech company', 'software company', 'tech firm'].some(v => lowerInput.includes(v))) {
    return 'Technology';
  }
  
  // Finance variations - comprehensive coverage
  if (['finance', 'financial', 'banking', 'bank', 'investment', 'investments',
       'investment banking', 'wealth management', 'asset management', 'accounting',
       'accountant', 'cpa', 'financial planning', 'financial advisor', 'fintech',
       'capital markets', 'private equity', 'pe', 'venture capital', 'vc', 'hedge fund',
       'trading', 'trader', 'financial analyst', 'corporate finance', 'commercial banking',
       'retail banking', 'investment management', 'financial services', 'credit', 'lending',
       'mortgage', 'payments', 'payment processing', 'digital banking', 'online banking',
       'cryptocurrency', 'crypto', 'insurance', 'underwriting', 'actuarial', 'risk management',
       'audit', 'auditing', 'tax', 'taxation', 'bookkeeping', 'treasury', 'm&a',
       'mergers and acquisitions', 'brokerage', 'securities', 'forex', 'derivatives',
       'financial institution', 'credit union', 'investment firm', 'private bank',
       'family office', 'trust', 'regtech', 'insurtech', 'trade finance'].some(v => lowerInput.includes(v))) {
    return 'Finance';
  }
  
  // Consulting variations - comprehensive coverage
  if (['consulting', 'consultant', 'consultants', 'advisory', 'advisor', 'advisers',
       'management consulting', 'business consulting', 'strategy', 'strategic',
       'strategic consulting', 'strategy consulting', 'professional services',
       'it consulting', 'tech consulting', 'technology consulting', 'financial consulting',
       'hr consulting', 'human resources consulting', 'marketing consulting',
       'operations consulting', 'supply chain consulting', 'change management',
       'digital transformation', 'process consulting', 'quality consulting',
       'risk consulting', 'compliance consulting', 'm&a consulting',
       'transaction advisory', 'valuation', 'restructuring', 'performance consulting',
       'organizational consulting', 'leadership consulting', 'executive coaching',
       'interim management', 'boutique consulting'].some(v => lowerInput.includes(v))) {
    return 'Consulting';
  }
  
  // Healthcare variations - comprehensive coverage
  if (['healthcare', 'health care', 'health', 'medical', 'medicine', 'med',
       'medical services', 'health services', 'hospital', 'hospitals', 'pharmaceutical',
       'pharmaceuticals', 'pharma', 'biotech', 'biotechnology', 'biomedical',
       'medical device', 'medical devices', 'healthcare technology', 'health technology',
       'medtech', 'telemedicine', 'telehealth', 'digital health', 'health informatics',
       'clinical', 'clinical services', 'nursing', 'nurse', 'physician', 'doctor',
       'surgeon', 'surgery', 'specialist', 'primary care', 'pediatrics', 'cardiology',
       'oncology', 'radiology', 'pharmacy', 'pharmacist', 'mental health', 'psychiatry',
       'psychology', 'therapy', 'physical therapy', 'occupational therapy', 'home health',
       'hospice', 'elder care', 'senior care', 'long term care', 'assisted living',
       'urgent care', 'emergency', 'public health', 'wellness', 'fitness', 'nutrition',
       'dental', 'dentistry', 'optometry', 'veterinary', 'vet', 'health insurance',
       'healthcare administration', 'healthcare management', 'medical research',
       'clinical research', 'cro', 'healthcare policy'].some(v => lowerInput.includes(v))) {
    return 'Healthcare';
  }
  
  // Education variations - comprehensive coverage
  if (['education', 'educational', 'teaching', 'teach', 'teacher', 'educator',
       'academic', 'academia', 'university', 'universities', 'college', 'colleges',
       'school', 'schools', 'k-12', 'k12', 'elementary', 'middle school', 'high school',
       'secondary', 'higher education', 'post-secondary', 'undergraduate', 'graduate',
       'graduate school', 'doctoral', 'phd', 'curriculum', 'instruction', 'learning',
       'educational technology', 'edtech', 'online education', 'e-learning', 'distance learning',
       'continuing education', 'professional development', 'corporate training',
       'vocational', 'trade school', 'technical school', 'adult education',
       'early childhood', 'preschool', 'kindergarten', 'special education',
       'bilingual education', 'stem', 'steam', 'tutoring', 'test prep', 'sat prep',
       'college counseling', 'admissions', 'educational consulting', 'lms',
       'learning management', 'educational assessment', 'education administration',
       'principal', 'superintendent'].some(v => lowerInput.includes(v))) {
    return 'Education';
  }
  
  // Marketing variations - comprehensive coverage
  if (['marketing', 'marketer', 'digital marketing', 'online marketing', 'internet marketing',
       'social media marketing', 'content marketing', 'email marketing', 'search marketing',
       'seo', 'search engine optimization', 'sem', 'ppc', 'pay per click', 'display advertising',
       'video marketing', 'mobile marketing', 'influencer marketing', 'affiliate marketing',
       'performance marketing', 'growth marketing', 'growth hacking', 'product marketing',
       'brand', 'branding', 'brand management', 'brand strategy', 'advertising', 'advertiser',
       'ad agency', 'creative', 'creative agency', 'communications', 'corporate communications',
       'pr', 'public relations', 'media relations', 'crisis communications',
       'reputation management', 'social media', 'content', 'content creation',
       'content strategy', 'seo', 'sem', 'ppc', 'advertising agency', 'marketing agency',
       'marketing services', 'advertising services', 'pr agency', 'communications agency'].some(v => lowerInput.includes(v))) {
    return 'Marketing';
  }
  
  // Sales variations - comprehensive coverage
  if (['sales', 'sale', 'selling', 'salesperson', 'sales rep', 'sales representative',
       'sales agent', 'sales executive', 'sales manager', 'sales director',
       'business development', 'bd', 'account management', 'account manager',
       'customer success', 'customer success manager', 'revenue', 'revenue generation',
       'account executive', 'ae', 'inside sales', 'outside sales', 'field sales',
       'territory sales', 'regional sales', 'national sales', 'enterprise sales',
       'sales operations', 'sales ops', 'sales enablement', 'sales training',
       'sales development', 'sdr', 'sales development rep', 'business development rep',
       'bdr', 'lead generation', 'lead gen', 'prospecting', 'cold calling',
       'sales pipeline', 'sales funnel', 'sales cycle', 'quota', 'sales quota',
       'commission', 'sales commission'].some(v => lowerInput.includes(v))) {
    return 'Sales';
  }
  
  // Legal variations - comprehensive coverage
  if (['legal', 'law', 'laws', 'lawyer', 'lawyers', 'attorney', 'attorneys',
       'counsel', 'counselor', 'barrister', 'solicitor', 'advocate',
       'legal counsel', 'legal advisor', 'legal consultant', 'legal services',
       'law firm', 'legal firm', 'attorney at law', 'litigation', 'litigator',
       'trial lawyer', 'corporate law', 'corporate lawyer', 'business law',
       'contract law', 'employment law', 'labor law', 'intellectual property',
       'ip', 'patent', 'trademark', 'copyright', 'real estate law', 'family law',
       'criminal law', 'criminal defense', 'personal injury', 'immigration law',
       'tax law', 'estate planning', 'trusts and estates', 'compliance',
       'regulatory', 'regulatory compliance', 'legal compliance', 'governance',
       'corporate governance', 'legal department', 'general counsel', 'gc',
       'paralegal', 'legal assistant', 'legal secretary', 'court', 'judiciary',
       'judge', 'judicial'].some(v => lowerInput.includes(v))) {
    return 'Legal';
  }
  
  // Non-profit variations - comprehensive coverage
  if (['non-profit', 'nonprofit', 'non profit', 'not-for-profit', 'not for profit',
       'ngo', 'non-governmental organization', 'non governmental organization',
       'foundation', 'charity', 'charities', 'charitable', 'philanthropy',
       'philanthropic', 'social impact', 'social good', 'social enterprise',
       'community organization', 'community service', 'volunteer', 'volunteering',
       'volunteer organization', 'service organization', 'civic organization',
       'advocacy', 'advocacy organization', 'humanitarian', 'humanitarian organization',
       'relief', 'relief organization', 'aid', 'aid organization', 'development',
       'development organization', 'international development', 'global development',
       'mission', 'mission-driven', 'mission driven', 'cause', 'cause-driven',
       'cause driven', '501c3', '501(c)(3)', 'tax-exempt', 'tax exempt',
       'nonprofit sector', 'third sector', 'voluntary sector', 'social sector'].some(v => lowerInput.includes(v))) {
    return 'Non-profit';
  }
  
  // If no match found, return null (will fall back to partial matching in API)
  return null;
}

/**
 * Checks if an industry value matches a preset industry (case-insensitive)
 */
export function isPresetIndustry(industry: string | null | undefined): boolean {
  if (!industry) return false;
  return industries.some(ind => ind.toLowerCase() === industry.trim().toLowerCase());
}

/**
 * Gets all preset industries
 */
export function getPresetIndustries(): string[] {
  return [...industries];
}