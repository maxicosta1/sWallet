-- Connect CRM opportunities with marketing campaigns.

ALTER TABLE "Opportunity"
ADD COLUMN "campaignId" TEXT;

CREATE INDEX "Opportunity_campaignId_idx" ON "Opportunity"("campaignId");

ALTER TABLE "Opportunity"
ADD CONSTRAINT "Opportunity_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
