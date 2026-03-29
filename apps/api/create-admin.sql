INSERT INTO "User" ("id", "email", "phone", "passwordHash", "firstName", "lastName", "country", "role", "updatedAt")
VALUES ('admin-uuid-001', 'admin@malitravail.ml', '70000000', '$2b$10$FCkx/CYfxLy5UryTEkAJxetBrtCDLRWhyvw.eItLlDmHWzuCl.EmG', 'Admin', 'MaliTravail', 'Mali', 'ADMIN', NOW())
ON CONFLICT ("email") DO UPDATE SET "role" = 'ADMIN';
