-- CreateTable
CREATE TABLE "donation_causes" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "titleHi" VARCHAR(255) NOT NULL,
    "titleEn" VARCHAR(255) NOT NULL,
    "descriptionHi" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "suggestedAmounts" INTEGER[],
    "targetAmountInPaise" INTEGER,
    "collectedAmountInPaise" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" VARCHAR(500),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_causes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "donationReference" VARCHAR(50) NOT NULL,
    "userId" TEXT,
    "causeId" TEXT,
    "donorName" VARCHAR(150) NOT NULL,
    "donorPhone" VARCHAR(20) NOT NULL,
    "donorEmail" VARCHAR(255),
    "donorPan" VARCHAR(10),
    "donorAddress" TEXT,
    "donorCity" VARCHAR(100),
    "donorState" VARCHAR(100),
    "amountInPaise" INTEGER NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway" "PaymentGateway" NOT NULL DEFAULT 'RAZORPAY',
    "gatewayOrderId" VARCHAR(100),
    "gatewayPaymentId" VARCHAR(100),
    "gatewaySignature" VARCHAR(255),
    "idempotencyKey" VARCHAR(100),
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "receiptNumber" VARCHAR(50),
    "receiptIssuedAt" TIMESTAMP(3),
    "notes" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donation_causes_slug_key" ON "donation_causes"("slug");

-- CreateIndex
CREATE INDEX "donation_causes_isActive_sortOrder_idx" ON "donation_causes"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "donations_donationReference_key" ON "donations"("donationReference");

-- CreateIndex
CREATE UNIQUE INDEX "donations_gatewayOrderId_key" ON "donations"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "donations_gatewayPaymentId_key" ON "donations"("gatewayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "donations_idempotencyKey_key" ON "donations"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "donations_receiptNumber_key" ON "donations"("receiptNumber");

-- CreateIndex
CREATE INDEX "donations_userId_idx" ON "donations"("userId");

-- CreateIndex
CREATE INDEX "donations_causeId_idx" ON "donations"("causeId");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- CreateIndex
CREATE INDEX "donations_gatewayOrderId_idx" ON "donations"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "donations_gatewayPaymentId_idx" ON "donations"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "donations_createdAt_idx" ON "donations"("createdAt");

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "donation_causes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
