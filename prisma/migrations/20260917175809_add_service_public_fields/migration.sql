-- AlterTable
ALTER TABLE "services" ADD COLUMN     "availabilityEn" VARCHAR(100),
ADD COLUMN     "availabilityHi" VARCHAR(100),
ADD COLUMN     "bookingStatus" VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "imageUrl" VARCHAR(500),
ADD COLUMN     "price" INTEGER DEFAULT 0;
