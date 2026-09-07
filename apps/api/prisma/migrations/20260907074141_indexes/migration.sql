-- CreateIndex
CREATE INDEX "Article_authorId_publishedAt_idx" ON "Article"("authorId", "publishedAt");

-- CreateIndex
CREATE INDEX "Message_handled_createdAt_idx" ON "Message"("handled", "createdAt");

-- CreateIndex
CREATE INDEX "Partner_stripeSessionId_idx" ON "Partner"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Subscriber_stripeSubscriptionId_idx" ON "Subscriber"("stripeSubscriptionId");
