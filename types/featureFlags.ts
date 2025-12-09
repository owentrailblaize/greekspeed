// types/featureFlags.ts

export interface ChapterFeatureFlags {
    financial_tools_enabled: boolean;
    recruitment_crm_enabled: boolean;
    // Future flags can be added here
    // vendor_management_enabled?: boolean;
    // sms_communication_enabled?: boolean;
    // budget_builder_enabled?: boolean;
    // social_scheduling_enabled?: boolean;
    // task_assignment_enabled?: boolean;
    // document_storage_enabled?: boolean;
  }
  
  export const DEFAULT_FEATURE_FLAGS: ChapterFeatureFlags = {
    financial_tools_enabled: false,
    recruitment_crm_enabled: false,
  };
  
  // Mapping of feature flags to UI components
  export const FEATURE_FLAG_MAPPINGS = {
    financial_tools_enabled: {
      execDashboardComponents: ['dues', 'budget'], // Features in UnifiedExecutiveDashboard
      memberPortalComponents: ['pay-dues'], // Features in ActiveMemberOverview
      apiRoutes: [
        '/api/dues',
        '/api/dues/assignments',
        '/api/dues/cycles',
        '/api/dues/pay',
      ],
    },
    recruitment_crm_enabled: {
      execDashboardComponents: ['recruitment-crm'],
      memberPortalComponents: ['recruitment'],
      apiRoutes: [
        '/api/recruitment',
        // Add more routes as CRM is built
      ],
    },
  } as const;