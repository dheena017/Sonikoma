import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import {
  MARKETPLACE_SUB_TABS,
  MOCK_MARKETPLACE_PACKS,
} from "../../data/marketplaceData";
import { MarketplaceWorkspaceHeader } from "./components/MarketplaceWorkspaceHeader";
import { MarketplacePackCard } from "./components/MarketplacePackCard";
import { MarketplaceFeaturedBanner } from "./components/MarketplaceFeaturedBanner";

interface MarketplaceWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const MarketplaceWorkspace: React.FC<MarketplaceWorkspaceProps> = ({
  onTriggerFeedback,
}) => {
  const [activeTab, setActiveTab] = useState("Comic Packs");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <WorkspaceLayout>
      {/* Dedicated Separated Header — contains Tabs + Search inside */}
      <MarketplaceWorkspaceHeader
        tabs={MARKETPLACE_SUB_TABS}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <WorkspaceLayout.Content>
        {/* Featured Banner Component */}
        <MarketplaceFeaturedBanner
          title="Cyberpunk Webtoon Mega Pack"
          subtitle="100+ assets · 4K panels · 12 transitions"
        />

        {/* Pack Cards Component */}
        <div className="space-y-2 pt-2">
          {MOCK_MARKETPLACE_PACKS.map((pack) => (
            <MarketplacePackCard
              key={pack.id}
              pack={pack}
              onPurchase={() =>
                onTriggerFeedback(
                  `${pack.price === "Free" ? "Downloaded" : "Purchased"}: ${
                    pack.title
                  }`
                )
              }
            />
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Creator Marketplace" />
    </WorkspaceLayout>
  );
};
