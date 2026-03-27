INSERT INTO "User" ("id", "email", "phone", "passwordHash", "firstName", "lastName", "country", "role", "updatedAt")
VALUES ('admin-uuid-001', 'admin@maliemploi.ml', '70000000', '$2b$10$FCkx/CYfxLy5UryTEkAJxetBrtCDLRWhyvw.eItLlDmHWzuCl.EmG', 'Admin', 'MaliEmploi', 'Mali', 'ADMIN', NOW())
ON CONFLICT ("email") DO UPDATE SET "role" = 'ADMIN';
