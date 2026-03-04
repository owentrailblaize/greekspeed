# AI Agent Guidelines for Trailblaize

## Purpose
This document provides specific guidance for AI agents working on this codebase.

## Codebase Context

### What This Project Is
- Greek life (fraternity/sorority) chapter management platform
- Alumni networking and directory
- Dues payment processing
- Social feed for chapter communication
- Event management

### Key Business Logic
- Users belong to chapters (Greek organizations)
- Posts are chapter-scoped (only chapter members see them)
- Comments belong to posts
- Payments are tracked per user per chapter
- Role-based permissions: active members, alumni, exec admin

## When Making Changes

### Always Do
1. **Check existing patterns first**
   - Look for similar features/components
   - Follow established patterns
   - Maintain consistency

2. **Update types when adding data structures**
   - Add to `types/` directory
   - Export from appropriate file
   - Update related interfaces

3. **Handle errors gracefully**
   - Try-catch blocks
   - User-friendly error messages
   - Log errors for debugging

4. **Consider mobile responsiveness**
   - Test on mobile viewport
   - Use Tailwind responsive classes
   - Consider touch interactions

5. **Maintain type safety**
   - No `any` types without justification
   - Proper TypeScript interfaces
   - Type guards when needed

### Never Do
1. **Don't break existing functionality**
   - Test changes thoroughly
   - Check for breaking changes
   - Maintain backward compatibility

2. **Don't bypass security**
   - Always check authentication
   - Verify authorization
   - Don't expose sensitive data

3. **Don't hardcode values**
   - Use environment variables
   - Use configuration files
   - Make it configurable

4. **Don't create duplicate code**
   - Check `lib/utils/` first
   - Reuse existing components
   - Extract common patterns

5. **Don't ignore TypeScript errors**
   - Fix all type errors
   - Don't use `@ts-ignore` without reason
   - Maintain type safety

## Common Tasks

### Adding Link Preview Support
- Use `lib/services/linkPreviewService.ts`
- Store previews in `metadata.link_previews`
- Use `LinkPreviewCard` component
- Hide raw URLs when preview exists

### Creating API Routes
- Follow pattern in `app/api/posts/route.ts`
- Validate input
- Check authentication
- Use service functions
- Return consistent error format

### Creating Components
- Follow pattern in `components/features/social/PostCard.tsx`
- Use TypeScript interfaces
- Handle loading/error states
- Style with Tailwind
- Make it responsive

### Working with Supabase
- Use client from `lib/supabase/client.ts`
- Check RLS policies
- Handle errors properly
- Use transactions for multi-step operations

## Testing Your Changes

### Before Committing
1. Run `npm run lint` - fix all linting errors
2. Check TypeScript compilation - no errors
3. Test in browser - verify functionality
4. Test on mobile - check responsiveness
5. Test error cases - handle edge cases

### Common Issues to Check
- Authentication/authorization working?
- Mobile layout correct?
- Loading states showing?
- Error handling working?
- TypeScript types correct?

## Reference Files

### For Link Previews
- `lib/services/linkPreviewService.ts` - Link preview fetching
- `components/features/social/LinkPreviewCard.tsx` - Preview component
- `components/features/social/PostCard.tsx` - Usage example

### For API Routes
- `app/api/posts/route.ts` - Post API example
- `app/api/posts/[id]/comments/route.ts` - Nested route example

### For Components
- `components/features/social/PostCard.tsx` - Complex component example
- `components/features/social/CommentModal.tsx` - Modal example

### For Hooks
- `lib/hooks/useComments.ts` - Custom hook example
- `lib/hooks/usePosts.ts` - Data fetching hook example

## Questions to Ask Yourself

Before implementing a feature:
1. Does a similar feature exist? (check first)
2. What types do I need to add/update?
3. What API endpoints are needed?
4. What components are needed?
5. How does this affect mobile?
6. What error cases exist?
7. What security considerations?
8. How do I test this?

## Getting Help

If stuck:
1. Check existing similar code
2. Review architecture docs
3. Check TypeScript types
4. Review error messages carefully
5. Test incrementally
