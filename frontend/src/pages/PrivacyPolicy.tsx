import React from 'react';
import PageLayout from '@/components/layout/PageLayout';

const PrivacyPolicy = () => {
  return (
    <PageLayout
      title="Privacy Policy"
      description="Learn how SAI TEJA DANDU protects your privacy"
      showSidebar={false}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>

          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-6">
              Last updated on Sep 26 2025
            </p>

            <div className="space-y-6">
              <p>
                This privacy policy sets out how SAI TEJA DANDU uses and protects any information that you give SAI TEJA DANDU when you visit their website and/or agree to purchase from them.
              </p>

              <p>
                SAI TEJA DANDU is committed to ensuring that your privacy is protected. Should we ask you to provide certain information by which you can be identified when using this website, and then you can be assured that it will only be used in accordance with this privacy statement.
              </p>

              <p>
                SAI TEJA DANDU may change this policy from time to time by updating this page. You should check this page from time to time to ensure that you adhere to these changes.
              </p>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">We may collect the following information:</h2>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Name</li>
                  <li>Contact information including email address</li>
                  <li>Demographic information such as postcode, preferences and interests, if required</li>
                  <li>Other information relevant to customer surveys and/or offers</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">What we do with the information we gather</h2>
                <p className="mb-3">
                  We require this information to understand your needs and provide you with a better service, and in particular for the following reasons:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Internal record keeping.</li>
                  <li>We may use the information to improve our products and services.</li>
                  <li>We may periodically send promotional emails about new products, special offers or other information which we think you may find interesting using the email address which you have provided.</li>
                  <li>From time to time, we may also use your information to contact you for market research purposes. We may contact you by email, phone, fax or mail. We may use the information to customise the website according to your interests.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Security</h2>
                <p className="text-muted-foreground">
                  We are committed to ensuring that your information is secure. In order to prevent unauthorised access or disclosure we have put in suitable measures.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">How we use cookies</h2>
                <p className="text-muted-foreground mb-3">
                  A cookie is a small file which asks permission to be placed on your computer's hard drive. Once you agree, the file is added and the cookie helps analyze web traffic or lets you know when you visit a particular site. Cookies allow web applications to respond to you as an individual. The web application can tailor its operations to your needs, likes and dislikes by gathering and remembering information about your preferences.
                </p>
                <p className="text-muted-foreground mb-3">
                  We use traffic log cookies to identify which pages are being used. This helps us analyze data about webpage traffic and improve our website in order to tailor it to customer needs. We only use this information for statistical analysis purposes and then the data is removed from the system.
                </p>
                <p className="text-muted-foreground mb-3">
                  Overall, cookies help us provide you with a better website, by enabling us to monitor which pages you find useful and which you do not. A cookie in no way gives us access to your computer or any information about you, other than the data you choose to share with us.
                </p>
                <p className="text-muted-foreground">
                  You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. This may prevent you from taking full advantage of the website.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Controlling your personal information</h2>
                <p className="text-muted-foreground mb-3">
                  You may choose to restrict the collection or use of your personal information in the following ways:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-3">
                  <li>whenever you are asked to fill in a form on the website, look for the box that you can click to indicate that you do not want the information to be used by anybody for direct marketing purposes</li>
                  <li>if you have previously agreed to us using your personal information for direct marketing purposes, you may change your mind at any time by writing to or emailing us at saitejadandu1231@gmail.com</li>
                </ul>
                <p className="text-muted-foreground mb-3">
                  We will not sell, distribute or lease your personal information to third parties unless we have your permission or are required by law to do so. We may use your personal information to send you promotional information about third parties which we think you may find interesting if you tell us that you wish this to happen.
                </p>
                <p className="text-muted-foreground">
                  If you believe that any information we are holding on you is incorrect or incomplete, please write to 201, plot no 856,maruthi sri nagar, sadhya school road, miyapur Hyderabad TELANGANA 500049 . or contact us at 7842691231 or saitejadandu1231@gmail.com as soon as possible. We will promptly correct any information found to be incorrect.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;