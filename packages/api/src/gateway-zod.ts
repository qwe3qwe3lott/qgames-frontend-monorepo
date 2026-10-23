// Barrel `@qgames/api/gateway/zod`: в режиме tags-split Orval собирает в zod/index.ts
// только схемы ручек по тегам, а схемы всех components (generateReusableSchemas) кладёт
// в zod/index.schemas.ts и в barrel не включает. Имена в двух файлах не пересекаются.
export * from './generated/gateway/zod';
export * from './generated/gateway/zod/index.schemas';
