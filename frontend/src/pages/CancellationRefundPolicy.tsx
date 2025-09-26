import React from 'react';
import PageLayout from '@/components/layout/PageLayout';

const CancellationRefundPolicy = () => {
  return (
    <PageLayout
      title="Cancellation & Refund Policy"
      description="Learn about SAI TEJA DANDU's cancellation and refund policies"
      showSidebar={false}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-8">Cancellation & Refund Policy</h1>

          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-6">
              Last updated on Sep 26 2025
            </p>

            <div className="space-y-6">
              <p>
                SAI TEJA DANDU believes in helping its customers as far as possible, and has therefore a liberal cancellation policy. Under this policy:
              </p>

              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  Cancellations will be considered only if the request is made within 7 days of placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.
                </li>
                <li>
                  SAI TEJA DANDU does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.
                </li>
                <li>
                  In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within 7 days of receipt of the products.
                </li>
                <li>
                  In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 7 days of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.
                </li>
                <li>
                  In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.
                </li>
                <li>
                  In case of any Refunds approved by the SAI TEJA DANDU, it'll take 6-8 days for the refund to be processed to the end customer.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CancellationRefundPolicy;