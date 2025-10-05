import React from 'react';
import PageLayout from '@/components/layout/PageLayout';

const ContactUs = () => {
  return (
    <PageLayout
      title="Contact Us"
      description="Get in touch with Yuktor Technologies"
      showSidebar={false}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-8">Contact Us</h1>

          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              Last updated on Oct 5 2025
            </p>

            <p className="mb-6">
              You may contact us using the information below:
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Merchant Legal entity name:</h3>
                <p className="text-muted-foreground">Yuktor Technologies Private Limited</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">Registered Address:</h3>
                <p className="text-muted-foreground">
                  Suite 204, Tech Park Plaza, Cyber City, Hyderabad India
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">Operational Address:</h3>
                <p className="text-muted-foreground">
                  Suite 204, Tech Park Plaza, Cyber City, Hyderabad India
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">Telephone No:</h3>
                <p className="text-muted-foreground">+91-124-4567890</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">E-Mail ID:</h3>
                <p className="text-muted-foreground">support@yuktor.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ContactUs;