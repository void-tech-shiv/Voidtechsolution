/**
 * Central Export Hub for CMS Zod Validation Schemas
 * 
 * VOIDTECH SOLUTION — Phase 10 Admin CMS
 * Comprehensive runtime validation for CMS entities, workflows, and queries.
 */

// 1. Common validation primitives
export * from "./common.schema";

// 2. ContentItem schemas and DTO types
export * from "./content-item.schema";

// 3. ContentRevision schemas and DTO types
export * from "./content-revision.schema";

// 4. PageSection schemas and DTO types
export * from "./page-section.schema";

// 5. Testimonial schemas and DTO types
export * from "./testimonial.schema";

// 6. MediaAsset schemas and DTO types
export * from "./media-asset.schema";

// 7. Publication workflow schemas and DTO types
export * from "./publication.schema";
