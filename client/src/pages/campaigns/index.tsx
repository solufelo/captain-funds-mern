import { Typography, Card, Button, Progress } from "antd";
import { HeartOutlined, FundOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import type { Campaign } from "../../interfaces/index";
import DonationModal from "../../components/DonationModal";
import campaignService from "../../services/campaignService";

const { Title, Text } = Typography;

function CampaignsPage() {
  const [donationModalVisible, setDonationModalVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    campaignService.getAllCampaigns().then(setCampaigns).catch(() => setCampaigns([]));
  }, []);

  const refreshCampaigns = () => {
    campaignService.getAllCampaigns().then(setCampaigns).catch(() => {});
  };

  const handleDonateClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDonationModalVisible(true);
  };

  const handleDonationSuccess = () => {
    refreshCampaigns();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={1} className="flex items-center gap-3">
            <FundOutlined />
            Campaigns
          </Title>
          <Text type="secondary">
            Support meaningful causes and make a difference
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign, index) => {
          const progressPercent = Math.round(
            (campaign.EventCurrentAmount / campaign.EventTargetAmount) * 100
          );
          const gradients = [
            "from-blue-400 to-blue-600",
            "from-red-400 to-red-600",
            "from-purple-400 to-purple-600",
          ];

          return (
            <Card
              key={campaign._id}
              className="hover:shadow-lg transition-shadow"
              cover={
                <div
                  className={`h-48 bg-gradient-to-r ${gradients[index]} flex items-center justify-center`}
                >
                  <FundOutlined className="text-white text-4xl" />
                </div>
              }
            >
              <div className="p-4">
                <Title level={4}>{campaign.title}</Title>
                <Text type="secondary" className="block mb-2">
                  <strong>Organizer:</strong> {campaign.organizer}
                </Text>
                <Text type="secondary" className="block mb-2">
                  <strong>Category:</strong> {campaign.EventCategory} •{" "}
                  <strong>Location:</strong> {campaign.location}
                </Text>
                <Text type="secondary" className="block mb-4">
                  {campaign.description}
                </Text>

                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <Text strong>
                      ${campaign.EventCurrentAmount.toLocaleString()} raised
                    </Text>
                    <Text type="secondary">
                      of ${campaign.EventTargetAmount.toLocaleString()} goal
                    </Text>
                  </div>
                  <Progress percent={progressPercent} strokeColor="#52c41a" />
                </div>

                <div className="mb-4">
                  <Text type="secondary" className="text-sm">
                    <strong>Ends:</strong>{" "}
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </Text>
                </div>

                <Button
                  type="primary"
                  block
                  icon={<HeartOutlined />}
                  className="bg-green-500 border-green-500 hover:bg-green-600"
                  onClick={() => handleDonateClick(campaign)}
                >
                  Donate Now
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Text type="secondary">
          Support meaningful causes and make a difference in your community.
        </Text>
      </div>

      {/* Donation Modal */}
      <DonationModal
        visible={donationModalVisible}
        onCancel={() => setDonationModalVisible(false)}
        campaign={selectedCampaign}
        onSuccess={handleDonationSuccess}
      />
    </div>
  );
}

export default CampaignsPage;
