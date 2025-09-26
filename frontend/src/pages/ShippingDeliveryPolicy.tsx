import React from 'react';
import PageLayout from '@/components/layout/PageLayout';

const ShippingDeliveryPolicy = () => {
  return (
    <PageLayout
      title="Shipping & Delivery Policy"
      description="Learn about SAI TEJA DANDU's shipping and delivery policies"
      showSidebar={false}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-8">Shipping & Delivery Policy</h1>

          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-6">
              Last updated on Sep 26 2025
            </p>

            <div className="space-y-6">
              <p>
                For International buyers, orders are shipped and delivered through registered international courier companies and/or International speed post only. For domestic buyers, orders are shipped through registered domestic courier companies and /or speed post only. Orders are shipped within 0-7 days or as per the delivery date agreed at the time of order confirmation and delivering of the shipment subject to Courier Company / post office norms. SAI TEJA DANDU is not liable for any delay in delivery by the courier company / postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within 0-7 days rom the date of the order and payment or as per the delivery date agreed at the time of order confirmation. Delivery of all orders will be to the address provided by the buyer. Delivery of our services will be confirmed on your mail ID as specified during registration. For any issues in utilizing our services you may contact our helpdesk on 7842691231 or saitejadandu1231@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ShippingDeliveryPolicy;