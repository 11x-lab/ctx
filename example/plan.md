---
issue_link: https://github.com/backpac-dev/backpac/issues/767
git_branch: main
created_at: 2025-11-10T00:00:00Z
status: Reviewed
---

# Q&A

## Scope & Impact

**Q: What is in-scope for this TikTok URL validation implementation?**
A:
- Profile URL validation (e.g., tiktok.com/@username)
- Video URL validation (e.g., tiktok.com/@user/video/123)

**Q: What is out-of-scope for this change?**
A:
- URL shorteners (not expanding vm.tiktok.com, etc.)
- Other platforms (not handling Instagram, YouTube, or other social platforms)

**Q: What existing code, libraries, or patterns can be reused for this validation?**
A: Nothing to reuse - starting from scratch, no existing patterns

**Q: Which modules/files/classes/functions will be affected by this change?**
A: New utility file to be created (location TBD by user)

## Design Overview

**Q: What should the validation function return?**
A: Object with details - Return `{ isValid: boolean, type: 'profile'|'video', data: {...} }`

**Q: What TikTok URL formats should be supported?**
A:
- Mobile app URLs (tiktok://user/@username or similar app schemes)
- Without protocol (accept tiktok.com/@username without https://)

**Q: What data should be extracted from TikTok URLs when validated?**
A: Video ID (extract video ID from video URLs)

**Q: Are there external systems to integrate with for this validation?**
A: TikTok API - Validate against TikTok API to check existence

## Testing Strategy

**Q: Will you write test code for this feature?**
A: No tests needed

# Implementation Plan

## Phase 1: Core Validation Logic

### Step 1: Create TikTok Validator Utility
- [ ] Create new utility file for TikTok URL validation
- [ ] Define TypeScript interfaces for validation result object
- [ ] Define supported URL format types (profile, video)

### Step 2: Implement URL Pattern Matching
- [ ] Implement profile URL validation logic
  - Support mobile app URLs (tiktok://user/@username)
  - Support URLs without protocol (tiktok.com/@username)
- [ ] Implement video URL validation logic
  - Extract video ID from URL
  - Support mobile app video URLs
  - Support URLs without protocol

### Step 3: Build Validation Response Object
- [ ] Return structured object with `isValid`, `type`, and `data` fields
- [ ] Extract and include username from profile URLs
- [ ] Extract and include video ID from video URLs

## Phase 2: TikTok API Integration

### Step 1: API Client Setup
- [ ] Research TikTok API endpoints for URL verification
- [ ] Set up API client configuration (API keys, base URL)
- [ ] Implement authentication mechanism for TikTok API

### Step 2: API Validation Implementation
- [ ] Implement API call to verify profile URL existence
- [ ] Implement API call to verify video URL existence
- [ ] Handle API errors and rate limiting
- [ ] Add timeout handling for API requests

### Step 3: Combine Local and API Validation
- [ ] First validate URL format locally
- [ ] If format is valid, verify existence via TikTok API
- [ ] Return comprehensive validation result with both checks

## Files to Modify
None (new implementation)

## Files/Objects to Reuse
None (starting from scratch per Q&A)

## New Files to Create
- `src/utils/tiktok-validator.ts` - Main validation utility
- `src/types/tiktok.ts` - TypeScript type definitions
- `src/api/tiktok-client.ts` - TikTok API client wrapper

## Notes
- **URL Format Priority**: Focus on mobile app URLs and protocol-less URLs
- **API Integration**: Will require TikTok API credentials and rate limit handling
- **Error Handling**: Distinguish between format errors and API errors
- **Return Object Structure**:
  ```typescript
  {
    isValid: boolean,
    type: 'profile' | 'video' | null,
    data: {
      username?: string,
      videoId?: string,
      normalizedUrl?: string
    }
  }
  ```
- **No Tests**: Per user request, skipping test implementation
