-- CreateTable (User, OtpCode, UserSession, PinSetupToken, Payment, Assessment — SMS/to'lov/ro'yxat uchun)
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pinHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PinSetupToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PinSetupToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "merchantTransId" TEXT NOT NULL,
    "clickTransId" TEXT,
    "merchantPrepareId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "testType" TEXT NOT NULL DEFAULT 'screening',
    "ageGroup" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "aiSummaryStatus" TEXT NOT NULL DEFAULT 'pending',
    "aiSummaryPayload" JSONB,
    "aiSummaryLocale" TEXT,
    "aiSummaryError" TEXT,
    "respondent" TEXT,
    "childGender" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "OtpCode_phone_idx" ON "OtpCode"("phone");
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");
CREATE UNIQUE INDEX "PinSetupToken_token_key" ON "PinSetupToken"("token");
CREATE INDEX "Payment_phone_idx" ON "Payment"("phone");
CREATE UNIQUE INDEX "Payment_merchantTransId_key" ON "Payment"("merchantTransId");
CREATE INDEX "Assessment_paymentId_idx" ON "Assessment"("paymentId");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
