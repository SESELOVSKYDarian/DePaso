-- AlterTable: confirmación de mail al registrarse
ALTER TABLE `users` ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;

-- Las cuentas que ya existían se dan por confirmadas (no se las bloquea de golpe)
UPDATE `users` SET `emailVerifiedAt` = `createdAt`;
