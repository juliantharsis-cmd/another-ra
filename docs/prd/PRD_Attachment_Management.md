# Product Requirements Document: Attachment Management

## Document Information

**Document Title:** Attachment Management System  
**Version:** 1.0  
**Date:** January 2025  
**Last Updated:** January 2025  
**Author:** Product Team  
**Status:** Approved  
**Domain:** data-management, file-storage, user-experience  
**Project Naming:** another-ra-ui, another-ra-api

---

## 1. Executive Summary

### 1.1. Problem Statement

Users need to attach files (images, documents, PDFs) to records in various tables (e.g., Industry Factors, User Profiles). The current system needs to support:
- Uploading files from the user's device
- Displaying file previews (thumbnails for images)
- Managing multiple attachments per record
- Removing attachments
- Persisting attachments across database systems (Airtable and PostgreSQL)

### 1.2. Solution Overview

Implement a comprehensive attachment management system that:
- Provides a user-friendly file upload interface
- Supports multiple file types (images, PDFs, documents)
- Displays file previews and metadata
- Handles file storage differently for Airtable vs PostgreSQL
- Filters invalid attachments to prevent save errors
- Provides clear user feedback for temporary vs permanent attachments

### 1.3. Business Value

**User Productivity:** Enables users to attach supporting documents directly to records  
**Data Integrity:** Centralizes file management with records  
**Flexibility:** Works with both Airtable (current) and PostgreSQL (target) databases  
**User Experience:** Intuitive file upload and preview interface  
**Error Prevention:** Prevents save errors by filtering invalid attachments

---

## 2. User Personas & Use Cases

### 2.1. Primary Personas

**Persona 1: Data Manager**
- **Characteristics:** Manages industry classification data, needs to attach reference documents
- **Needs:** Upload PDFs, images, and documents to support data entries
- **Pain Points:** Files scattered across different locations, hard to associate with records

**Persona 2: System Administrator**
- **Characteristics:** Manages user profiles, needs to attach profile pictures
- **Needs:** Upload and manage user profile images
- **Pain Points:** Profile pictures not linked to user records

### 2.2. Use Cases

**UC1: Upload Industry Factor Document**
1. User opens Industry Factors table
2. User selects a record and opens detail panel
3. User clicks "Choose File" in Attachment field
4. User selects a PDF document
5. System uploads file and displays preview
6. User saves record
7. Attachment is persisted with the record

**UC2: Remove Attachment**
1. User views record with existing attachments
2. User clicks "Remove" button on an attachment
3. Attachment is removed from the list
4. User saves record
5. Attachment is removed from database

**UC3: Upload Multiple Attachments**
1. User selects multiple files in file picker
2. System uploads all files sequentially
3. All files appear in attachment list
4. User can remove individual files
5. All remaining files are saved with record

---

## 3. User Stories

**US1:** As a data manager, I want to upload PDF documents to industry factor records so that I can attach reference materials.

**US2:** As a system administrator, I want to upload profile pictures to user records so that users have visual identification.

**US3:** As a user, I want to see previews of attached images so that I can verify the correct file was uploaded.

**US4:** As a user, I want to remove attachments so that I can update or correct file associations.

**US5:** As a user, I want to see file size and type information so that I understand what files are attached.

**US6:** As a developer, I want the attachment system to work with both Airtable and PostgreSQL so that migration is seamless.

---

## 4. Functional Requirements

### 4.1. File Upload

**FR1.1: File Selection**
- **Requirement:** Users can select files via file input dialog
- **Acceptance Criteria:**
  - File input accepts multiple file selection
  - Supported file types: images (jpg, png, gif, webp), PDFs, documents (doc, docx)
  - File size limit: 10MB per file
  - File input is disabled when field is read-only

**FR1.2: File Upload Process**
- **Requirement:** Files are uploaded immediately when selected
- **Acceptance Criteria:**
  - Upload starts automatically after file selection
  - Upload progress is indicated in UI ("Uploading..." message)
  - Upload errors are displayed to user
  - Successful uploads appear in attachment list immediately

**FR1.3: File Validation**
- **Requirement:** Files are validated before upload
- **Acceptance Criteria:**
  - File type is checked against allowed types
  - File size is checked against 10MB limit
  - Invalid files show error message
  - Valid files proceed to upload

### 4.2. File Display

**FR2.1: Attachment List**
- **Requirement:** Attachments are displayed in a list format
- **Acceptance Criteria:**
  - Each attachment shows thumbnail (for images) or icon (for documents)
  - Filename is displayed and truncated if too long
  - File size is displayed in KB
  - Attachments are displayed in upload order

**FR2.2: Image Previews**
- **Requirement:** Image attachments show thumbnail previews
- **Acceptance Criteria:**
  - Thumbnails are 80x80 pixels
  - Thumbnails maintain aspect ratio
  - Failed image loads are handled gracefully
  - Thumbnails are clickable to view full size (future enhancement)

**FR2.3: File Metadata**
- **Requirement:** File metadata is displayed
- **Acceptance Criteria:**
  - Filename is always visible
  - File size is displayed in human-readable format (KB)
  - File type icon is shown for non-image files
  - Upload status is indicated (uploading, success, failed)

### 4.3. File Management

**FR3.1: Remove Attachment**
- **Requirement:** Users can remove attachments
- **Acceptance Criteria:**
  - Remove button is visible for each attachment (when editable)
  - Clicking remove removes attachment from list immediately
  - Removed attachments are not saved to database
  - Remove action is confirmed by UI update

**FR3.2: Multiple Attachments**
- **Requirement:** Records can have multiple attachments
- **Acceptance Criteria:**
  - Multiple files can be selected in one operation
  - All selected files are uploaded
  - All attachments are displayed in list
  - Each attachment can be removed independently

### 4.4. Database Integration

**FR4.1: Airtable Integration**
- **Requirement:** Attachments work with Airtable database
- **Acceptance Criteria:**
  - Only attachments with HTTP/HTTPS URLs are saved to Airtable
  - Data URLs are filtered out before save
  - Temporary attachments are filtered out before save
  - Existing Airtable attachments are displayed correctly

**FR4.2: PostgreSQL Integration**
- **Requirement:** Attachments work with PostgreSQL database (target)
- **Acceptance Criteria:**
  - Files can be stored as BLOBs in PostgreSQL
  - Files can be stored as file references (paths/URLs)
  - Attachment metadata is stored in database
  - File retrieval works correctly

**FR4.3: Database Agnostic Design**
- **Requirement:** Attachment system works with both databases
- **Acceptance Criteria:**
  - Service layer abstracts database differences
  - Repository pattern handles database switching
  - Frontend code is database-agnostic
  - Migration from Airtable to PostgreSQL is seamless

---

## 5. Non-Functional Requirements

### 5.1. Performance

**NFR1: Upload Performance**
- Files up to 10MB should upload within 30 seconds on standard broadband
- Multiple file uploads should be processed in parallel
- UI should remain responsive during upload

**NFR2: Display Performance**
- Thumbnails should load within 2 seconds
- Attachment list should render immediately
- No performance degradation with 10+ attachments

### 5.2. Usability

**NFR3: User Feedback**
- Clear indication of upload progress
- Error messages are user-friendly and actionable
- Success feedback when upload completes
- Warning messages for temporary attachments

**NFR4: Accessibility**
- File input is keyboard accessible
- Screen readers announce upload status
- Error messages are accessible
- Remove buttons have proper ARIA labels

### 5.3. Security

**NFR5: File Validation**
- File types are validated on both client and server
- File size limits are enforced
- Malicious file patterns are rejected
- File content is scanned (future enhancement)

**NFR6: Data Privacy**
- Files are stored securely
- Access control is enforced
- File URLs are not publicly accessible without authentication (future)

---

## 6. Technical Requirements

### 6.1. Architecture

**TR1: Frontend Components**
- `PanelField` component handles attachment rendering
- File upload uses native HTML5 File API
- FormData is used for multipart file uploads
- React state manages attachment list

**TR2: Backend API**
- Upload endpoint: `POST /api/industry-classification/upload`
- Uses multer middleware for file handling
- Files stored in memory temporarily
- Returns attachment object with metadata

**TR3: Database Services**
- `IndustryClassificationAirtableService` handles Airtable integration
- `IndustryClassificationPostgreSQLService` handles PostgreSQL integration (future)
- Repository pattern abstracts database differences
- Service layer filters invalid attachments

### 6.2. Data Models

**TR4: Attachment Object Structure**
```typescript
interface Attachment {
  id: string                    // Unique identifier
  url: string                   // File URL (HTTP/HTTPS for Airtable, path/URL for PostgreSQL)
  filename: string              // Original filename
  size: number                  // File size in bytes
  type: string                  // MIME type
  thumbnails?: {                // Thumbnail URLs (Airtable)
    small?: { url: string }
    large?: { url: string }
    full?: { url: string }
  }
  width?: number                // Image width (if image)
  height?: number               // Image height (if image)
}
```

**TR5: Temporary Attachment Structure**
```typescript
interface TemporaryAttachment extends Attachment {
  _isTemporary: true            // Marks as temporary
  _buffer?: string              // Base64 encoded file data
  dataUrl?: string              // Data URL for preview
}
```

### 6.3. API Endpoints

**TR6: Upload Endpoint**
- **Method:** POST
- **Path:** `/api/industry-classification/upload`
- **Content-Type:** `multipart/form-data`
- **Request:** FormData with `file` field
- **Response:** `{ success: boolean, data: Attachment }`
- **Error Handling:** Returns error object with message

**TR7: Update Endpoint (with attachments)**
- **Method:** PUT
- **Path:** `/api/industry-classification/:id`
- **Body:** Record data including `Attachment` field
- **Behavior:** Filters out temporary attachments before saving

### 6.4. File Storage

**TR8: Current Implementation (Airtable)**
- Files are uploaded to backend
- Backend creates temporary attachment object with data URL
- Data URLs are filtered out before saving to Airtable
- Airtable requires HTTP/HTTPS URLs for attachments
- **Limitation:** Files cannot be saved to Airtable without external storage

**TR9: Target Implementation (PostgreSQL)**
- Files can be stored as BLOBs in PostgreSQL
- Files can be stored on filesystem with database references
- Files can be stored in object storage (S3, etc.) with URLs in database
- Attachment metadata stored in `attachments` table
- **Advantage:** Direct file storage without external dependencies

---

## 7. Database Compatibility

### 7.1. Airtable (Current)

**How It Works:**
- Airtable requires attachments to have publicly accessible HTTP/HTTPS URLs
- Files cannot be uploaded directly to Airtable
- Attachment objects must include: `id`, `url`, `filename`, `size`, `type`
- Airtable provides thumbnail URLs automatically

**Limitations:**
- ❌ Cannot store files directly (requires external storage)
- ❌ Data URLs are not accepted
- ❌ Temporary files cannot be saved
- ✅ Provides automatic thumbnail generation
- ✅ Handles file metadata automatically

**Current Implementation:**
- Files are uploaded to backend
- Backend creates temporary attachment objects with data URLs
- Data URLs are filtered out before saving to Airtable
- Only existing attachments (with real URLs) are preserved
- **Result:** New uploads appear in UI but are not saved to Airtable

### 7.2. PostgreSQL (Target)

**How It Would Work:**

**Option 1: BLOB Storage**
```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_data BYTEA NOT NULL,  -- Binary file data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- ✅ Files stored directly in database
- ✅ No external dependencies
- ✅ Transactional consistency
- ⚠️ Database size grows with files
- ⚠️ Performance impact for large files

**Option 2: File System Storage**
```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_path VARCHAR(500) NOT NULL,  -- Path to file on filesystem
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- ✅ Files stored on filesystem
- ✅ Database stays lean
- ✅ Better performance for large files
- ⚠️ Requires filesystem management
- ⚠️ Backup complexity

**Option 3: Object Storage (Recommended)**
```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL,
  record_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_url VARCHAR(500) NOT NULL,  -- URL to S3/Cloudinary/etc
  storage_provider VARCHAR(50) NOT NULL,  -- 's3', 'cloudinary', etc.
  storage_key VARCHAR(255) NOT NULL,  -- Key in storage service
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- ✅ Scalable and performant
- ✅ CDN integration possible
- ✅ Automatic backups
- ✅ Works similar to Airtable (URL-based)
- ⚠️ Requires external service setup
- ✅ **Best option for production**

**Recommended Approach for PostgreSQL:**
- Use **Option 3 (Object Storage)** for production
- Use **Option 1 (BLOB)** for development/testing
- Implement service layer to abstract storage method
- Support migration between storage methods

### 7.3. Migration Path

**From Airtable to PostgreSQL:**

1. **Phase 1: Dual Support**
   - Implement PostgreSQL service alongside Airtable
   - Both services handle attachments differently
   - Frontend remains unchanged

2. **Phase 2: File Migration**
   - Download files from Airtable URLs
   - Upload to object storage (S3/Cloudinary)
   - Store new URLs in PostgreSQL
   - Update attachment records

3. **Phase 3: Cutover**
   - Switch database type to PostgreSQL
   - All new uploads go to object storage
   - Old Airtable URLs still accessible (read-only)

---

## 8. Implementation Details

### 8.1. Current Implementation

**Frontend (`PanelField.tsx`):**
- File input with multiple file support
- Immediate upload on file selection
- Upload progress indication
- Attachment list with thumbnails
- Remove functionality
- Warning for temporary attachments

**Backend (`IndustryClassificationController.ts`):**
- Multer middleware for file handling
- Memory storage (10MB limit)
- Returns temporary attachment object with data URL
- Marks attachments as `_isTemporary: true`

**Service Layer (`IndustryClassificationAirtableService.ts`):**
- Filters out temporary attachments before save
- Filters out data URLs before save
- Only saves attachments with HTTP/HTTPS URLs
- Preserves existing Airtable attachments

### 8.2. PostgreSQL Implementation (Future)

**Service Layer (`IndustryClassificationPostgreSQLService.ts`):**
```typescript
async uploadAttachment(file: Express.Multer.File): Promise<Attachment> {
  // Upload to S3/Cloudinary
  const storageUrl = await this.uploadToObjectStorage(file)
  
  // Store metadata in PostgreSQL
  const attachment = await this.db.attachments.create({
    record_id: recordId,
    record_type: 'industry_classification',
    filename: file.originalname,
    mime_type: file.mimetype,
    file_size: file.size,
    storage_url: storageUrl,
    storage_provider: 's3',
    storage_key: storageKey,
  })
  
  return this.mapToAttachment(attachment)
}
```

**Repository Pattern:**
- `IndustryClassificationRepository` selects service based on `DATABASE_TYPE`
- Airtable service: Filters temporary attachments
- PostgreSQL service: Uploads to object storage, saves metadata
- Frontend code remains unchanged

---

## 9. Success Metrics

**SM1: Upload Success Rate**
- Target: 95% of uploads complete successfully
- Measurement: Track upload success/failure events

**SM2: User Adoption**
- Target: 60% of records have at least one attachment within 3 months
- Measurement: Count records with attachments

**SM3: Error Reduction**
- Target: Zero save errors due to invalid attachments
- Measurement: Track attachment-related save errors

**SM4: Performance**
- Target: Upload completes within 30 seconds for 10MB files
- Measurement: Track upload duration

---

## 10. Risk Assessment

### 10.1. Technical Risks

**Risk 1: Airtable Limitation**
- **Impact:** High - Files cannot be saved to Airtable without external storage
- **Probability:** High - Current limitation
- **Mitigation:** 
  - Filter temporary attachments (implemented)
  - Show warning to users (implemented)
  - Plan for object storage integration

**Risk 2: File Size Limits**
- **Impact:** Medium - Large files may fail upload
- **Probability:** Medium
- **Mitigation:**
  - 10MB limit enforced
  - Clear error messages
  - Consider increasing limit for PostgreSQL

**Risk 3: Storage Costs**
- **Impact:** Medium - Object storage costs scale with usage
- **Probability:** Medium
- **Mitigation:**
  - Monitor storage usage
  - Implement file cleanup policies
  - Consider compression

### 10.2. UX Risks

**Risk 4: User Confusion**
- **Impact:** Medium - Users may not understand why files aren't saving
- **Probability:** Medium
- **Mitigation:**
  - Clear warning messages
  - Documentation
  - User training

---

## 11. Implementation Plan

### Phase 1: Current Implementation (✅ Complete)
- File upload UI
- Backend upload endpoint
- Attachment display
- Remove functionality
- Airtable filtering (temporary attachments)

### Phase 2: Object Storage Integration (🔜 Next)
- Integrate S3 or Cloudinary
- Update upload endpoint to use object storage
- Remove temporary attachment warnings
- Enable full save functionality

### Phase 3: PostgreSQL Support (🔜 Future)
- Implement PostgreSQL attachment service
- Create attachments table schema
- Implement file storage (BLOB or object storage)
- Update repository to support PostgreSQL

### Phase 4: Migration Tools (🔜 Future)
- Tool to migrate Airtable attachments to PostgreSQL
- Batch upload to object storage
- URL migration script

---

## 12. Acceptance Criteria

**AC1: File Upload**
- ✅ User can select files via file input
- ✅ Files upload immediately after selection
- ✅ Upload progress is shown
- ✅ Files appear in attachment list after upload
- ⚠️ Files are temporary (not saved to Airtable) - **Known limitation**

**AC2: File Display**
- ✅ Attachments are displayed in list
- ✅ Image thumbnails are shown
- ✅ File metadata (name, size) is displayed
- ✅ Upload status is indicated

**AC3: File Removal**
- ✅ Remove button is available for each attachment
- ✅ Clicking remove removes attachment from list
- ✅ Removed attachments are not saved

**AC4: Database Integration**
- ✅ Airtable: Temporary attachments are filtered out
- ✅ Airtable: Existing attachments are preserved
- ⚠️ PostgreSQL: Not yet implemented
- ✅ No save errors due to invalid attachments

---

## 13. Dependencies

**Technical Dependencies:**
- `multer` package for file upload handling
- Express.js for API endpoints
- React for frontend components
- Airtable API (current)
- PostgreSQL (target)
- Object Storage Service (S3/Cloudinary) - **Required for production**

**Data Dependencies:**
- Attachment metadata structure
- File storage location/URLs
- Database schema for attachments (PostgreSQL)

---

## 14. Appendices

### 14.1. Glossary

- **BLOB:** Binary Large Object - method of storing binary data in database
- **Data URL:** URL scheme for embedding data directly in HTML (data:image/png;base64,...)
- **Multer:** Node.js middleware for handling multipart/form-data (file uploads)
- **Object Storage:** Cloud storage service (S3, Cloudinary, etc.) for files
- **Temporary Attachment:** Attachment object with data URL that cannot be saved to Airtable

### 14.2. API Reference

**Upload Endpoint:**
```
POST /api/industry-classification/upload
Content-Type: multipart/form-data

Request:
  file: <File>

Response:
{
  "success": true,
  "data": {
    "id": "att_1234567890_abc",
    "url": "data:image/png;base64,...",
    "filename": "image.png",
    "size": 4093,
    "type": "image/png",
    "_isTemporary": true
  }
}
```

### 14.3. Code Examples

**Frontend Upload:**
```typescript
const formData = new FormData()
formData.append('file', file)

const response = await fetch('/api/industry-classification/upload', {
  method: 'POST',
  body: formData,
})
```

**Backend Filtering:**
```typescript
const validAttachments = attachments.filter((att: any) => {
  // Skip temporary and data URLs
  if (att._isTemporary || att.url?.startsWith('data:')) {
    return false
  }
  // Only keep HTTP/HTTPS URLs
  return att.url?.startsWith('http://') || att.url?.startsWith('https://')
})
```

---

## 15. PostgreSQL Compatibility Summary

### ✅ Will It Work with PostgreSQL?

**Yes, and it will work BETTER than Airtable!**

**Current State (Airtable):**
- ❌ Cannot save new file uploads (requires external storage)
- ✅ Can display existing attachments
- ⚠️ Limited by Airtable's URL requirement

**Future State (PostgreSQL):**
- ✅ Can save files directly (BLOB storage)
- ✅ Can save files to object storage (recommended)
- ✅ Can save files to filesystem
- ✅ Full control over file storage
- ✅ Better performance and scalability
- ✅ No external dependencies required (if using BLOB)

**Recommendation:**
- Use **PostgreSQL with Object Storage (S3/Cloudinary)** for production
- This provides the best of both worlds:
  - Scalable file storage
  - Fast file access
  - CDN integration
  - Automatic backups
  - Similar to Airtable's URL-based approach (easier migration)

**Migration Path:**
1. Implement object storage integration
2. Update PostgreSQL service to upload files to object storage
3. Store URLs in PostgreSQL (similar to Airtable)
4. Migrate existing Airtable attachments to object storage
5. Switch to PostgreSQL - seamless transition!

---

**Last Updated:** January 2025  
**Next Review:** After object storage integration

