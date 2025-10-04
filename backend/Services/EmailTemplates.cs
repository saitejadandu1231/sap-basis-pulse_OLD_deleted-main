using System;

namespace SapBasisPulse.Api.Services
{
    public static class EmailTemplates
    {
        public static string SupportRequestCreatedForCustomer(string customerName, string orderNumber, string supportType, string priority)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Support Request Created</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🎯 Support Request Created</h1>
                        <p>Your SAP BASIS support request has been submitted successfully</p>
                    </div>
                    <div class='content'>
                        <h2>Hello {customerName},</h2>
                        <p>Thank you for choosing Yuktor for your SAP BASIS support needs. Your support request has been created and is now being processed.</p>

                        <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;'>
                            <h3>Request Details:</h3>
                            <p><strong>Order Number:</strong> {orderNumber}</p>
                            <p><strong>Support Type:</strong> {supportType}</p>
                            <p><strong>Priority:</strong> {priority}</p>
                            <p><strong>Status:</strong> New Request</p>
                        </div>

                        <p><strong>What happens next?</strong></p>
                        <ul>
                            <li>Our team will review your request within 24 hours</li>
                            <li>A qualified SAP BASIS consultant will be assigned</li>
                            <li>You'll receive a notification once assigned</li>
                            <li>You can track progress in your dashboard</li>
                        </ul>

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://your-frontend-url.com/dashboard' class='button'>View in Dashboard</a>
                        </div>

                        <p>If you have any questions, feel free to reply to this email or contact our support team.</p>

                        <p>Best regards,<br>The Yuktor Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated message from Yuktor - Enterprise SAP BASIS Support Platform</p>
                        <p>© 2025 Yuktor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }

        public static string SupportRequestAssignedToConsultant(string consultantName, string customerName, string orderNumber, string supportType, string priority, string description)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>New Support Request Assigned</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    .urgent {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🚀 New Support Request Assigned</h1>
                        <p>You have been assigned a new SAP BASIS support request</p>
                    </div>
                    <div class='content'>
                        <h2>Hello {consultantName},</h2>
                        <p>A new support request has been assigned to you. Please review the details below and start working on it as soon as possible.</p>

                        <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c;'>
                            <h3>Request Details:</h3>
                            <p><strong>Order Number:</strong> {orderNumber}</p>
                            <p><strong>Customer:</strong> {customerName}</p>
                            <p><strong>Support Type:</strong> {supportType}</p>
                            <p><strong>Priority:</strong> {priority}</p>
                            <p><strong>Description:</strong></p>
                            <div style='background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;'>{description}</div>
                        </div>

                        {((priority == "VeryHigh" || priority == "High") ? "<div class='urgent'><strong>⚠️ High Priority Request</strong><br>This request requires immediate attention. Please prioritize this over lower priority tasks.</div>" : "")}

                        <p><strong>Next Steps:</strong></p>
                        <ul>
                            <li>Review the request details thoroughly</li>
                            <li>Contact the customer if you need clarification</li>
                            <li>Update the ticket status as you progress</li>
                            <li>Provide regular updates to the customer</li>
                        </ul>

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://your-frontend-url.com/dashboard' class='button'>View in Dashboard</a>
                        </div>

                        <p>Thank you for your dedication to providing excellent SAP BASIS support!</p>

                        <p>Best regards,<br>The Yuktor Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated message from Yuktor - Enterprise SAP BASIS Support Platform</p>
                        <p>© 2025 Yuktor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }

        public static string SupportRequestCreatedForAdmin(string customerName, string orderNumber, string supportType, string priority, string description)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>New Support Request - Admin Notification</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    .priority-high {{ background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>📋 New Support Request</h1>
                        <p>Admin notification - New request requires assignment</p>
                    </div>
                    <div class='content'>
                        <h2>Admin Alert</h2>
                        <p>A new support request has been created and requires consultant assignment.</p>

                        <div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;'>
                            <h3>Request Details:</h3>
                            <p><strong>Order Number:</strong> {orderNumber}</p>
                            <p><strong>Customer:</strong> {customerName}</p>
                            <p><strong>Support Type:</strong> {supportType}</p>
                            <p><strong>Priority:</strong> {priority}</p>
                            <p><strong>Description:</strong></p>
                            <div style='background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;'>{description}</div>
                        </div>

                        {((priority == "VeryHigh" || priority == "High") ? "<div class='priority-high'><strong>⚠️ High Priority Request</strong><br>This request should be assigned to a consultant immediately.</div>" : "")}

                        <p><strong>Action Required:</strong></p>
                        <ul>
                            <li>Review the request details</li>
                            <li>Assign an appropriate consultant based on skills and availability</li>
                            <li>Monitor the request progress</li>
                        </ul>

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://your-frontend-url.com/admin' class='button'>Assign Consultant</a>
                        </div>

                        <p>This notification ensures timely assignment of support requests.</p>

                        <p>Best regards,<br>Yuktor System</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated admin notification from Yuktor</p>
                        <p>© 2025 Yuktor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }
    }
}