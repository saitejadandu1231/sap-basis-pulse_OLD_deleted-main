import React from 'react';
import PageLayout from '@/components/layout/PageLayout';

const ContactUs = () => {
  return (
    <PageLayout
      title="Contact Us"
      description="Get in touch with SAI TEJA DANDU"
      showSidebar={false}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-8">Contact Us</h1>

          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              Last updated on Sep 26 2025
            </p>

            <p className="mb-6">
              You may contact us using the information below:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Merchant Legal entity name:</h3>
                <p className="text-muted-foreground">SAI TEJA DANDU</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">Registered Address:</h3>
                <p className="text-muted-foreground">
                  201, plot no 856,maruthi sri nagar, sadhya school road, miyapur Hyderabad TELANGANA 500049
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">Operational Address:</h3>
                <p className="text-muted-foreground">
                  201, plot no 856,maruthi sri nagar, sadhya school road, miyapur Hyderabad TELANGANA 500049
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">Telephone No:</h3>
                <p className="text-muted-foreground">7842691231</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">E-Mail ID:</h3>
                <p className="text-muted-foreground">saitejadandu1231@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ContactUs;