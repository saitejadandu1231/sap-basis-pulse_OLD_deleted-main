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
                            <a href='https://yuktor.vercel.app/' class='button'>View in Dashboard</a>
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
                            <a href='https://yuktor.vercel.app/' class='button'>View in Dashboard</a>
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

        public static string StatusChangedToInProgressForCustomer(string customerName, string orderNumber, string consultantName, string supportType)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Support Request In Progress</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    .progress-update {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🔄 Status Update: In Progress</h1>
                        <p>Your support request is now being actively worked on</p>
                    </div>
                    <div class='content'>
                        <h2>Hello {customerName},</h2>
                        <p>Great news! Your SAP BASIS support request has been started and is now in progress.</p>

                        <div class='progress-update'>
                            <h3>Status Update:</h3>
                            <p><strong>Order Number:</strong> {orderNumber}</p>
                            <p><strong>Support Type:</strong> {supportType}</p>
                            <p><strong>Consultant:</strong> {consultantName}</p>
                            <p><strong>Status:</strong> <span style='color: #4CAF50; font-weight: bold;'>In Progress</span></p>
                        </div>

                        <p><strong>What this means:</strong></p>
                        <ul>
                            <li>Your consultant is actively working on your request</li>
                            <li>You may receive updates and communications from the consultant</li>
                            <li>You can track real-time progress in your dashboard</li>
                            <li>The consultant may reach out if additional information is needed</li>
                        </ul>

                        <div style='background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                            <h4 style='margin-top: 0; color: #2e7d32;'>💡 Pro Tip:</h4>
                            <p style='margin-bottom: 0;'>Stay available for communication as your consultant may need clarifications or additional details to provide the best solution.</p>
                        </div>

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://yuktor.vercel.app/tickets' class='button'>View Progress</a>
                        </div>

                        <p>Thank you for choosing Yuktor for your SAP BASIS support needs!</p>

                        <p>Best regards,<br>The Yuktor Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated status update from Yuktor - Enterprise SAP BASIS Support Platform</p>
                        <p>© 2025 Yuktor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }

        public static string StatusChangedToInProgressForConsultant(string consultantName, string customerName, string orderNumber, string supportType, string priority, string description)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Status Updated: In Progress</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    .status-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>📋 Status Updated</h1>
                        <p>You've marked this request as In Progress</p>
                    </div>
                    <div class='content'>
                        <h2>Hello {consultantName},</h2>
                        <p>This is a confirmation that you have successfully updated the status of the support request to ""In Progress"". The customer has been notified of this status change.</p>

                        <div class='status-box'>
                            <h3>Request Details:</h3>
                            <p><strong>Order Number:</strong> {orderNumber}</p>
                            <p><strong>Customer:</strong> {customerName}</p>
                            <p><strong>Support Type:</strong> {supportType}</p>
                            <p><strong>Priority:</strong> {priority}</p>
                            <p><strong>Status:</strong> <span style='color: #2196F3; font-weight: bold;'>In Progress</span></p>
                        </div>

                        <div style='background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                            <h4 style='margin-top: 0; color: #1976D2;'>📋 Request Description:</h4>
                            <p style='margin-bottom: 0; font-style: italic;'>{description}</p>
                        </div>

                        <p><strong>Next Steps:</strong></p>
                        <ul>
                            <li>Continue working on the customer's request</li>
                            <li>Communicate with the customer as needed</li>
                            <li>Update progress regularly</li>
                            <li>Mark as completed when the issue is resolved</li>
                        </ul>

                        <div style='background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <strong>📞 Customer Communication:</strong><br>
                            The customer has been automatically notified of this status change. They know their request is now being actively worked on.
                        </div>

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://yuktor.vercel.app/dashboard' class='button'>View Dashboard</a>
                        </div>

                        <p>Keep up the excellent work!</p>

                        <p>Best regards,<br>The Yuktor Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated confirmation from Yuktor - Enterprise SAP BASIS Support Platform</p>
                        <p>© 2025 Yuktor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }

        public static string TicketCompletedForCustomer(string customerName, string orderNumber, string consultantName, string supportType, decimal hoursWorked, decimal hourlyRate, decimal calculatedAmount)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Support Request Completed - Invoice Summary</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    .completion-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }}
                    .invoice-box {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #4CAF50; }}
                    .amount-highlight {{ font-size: 24px; font-weight: bold; color: #4CAF50; text-align: center; padding: 15px; background: white; border-radius: 8px; margin: 10px 0; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>✅ Support Request Completed</h1>
                        <p>Your issue has been successfully resolved</p>
                    </div>
                    <div class='content'>
                        <h2>Hello {customerName},</h2>
                        <p>Great news! Your SAP BASIS support request has been completed successfully. Our consultant has resolved your issue and provided the final work summary below.</p>

                        <div class='completion-box'>
                            <h3>Completion Summary:</h3>
                            <p><strong>Order Number:</strong> {orderNumber}</p>
                            <p><strong>Support Type:</strong> {supportType}</p>
                            <p><strong>Consultant:</strong> {consultantName}</p>
                            <p><strong>Status:</strong> <span style='color: #4CAF50; font-weight: bold;'>✅ Completed</span></p>
                        </div>

                        <div class='invoice-box'>
                            <h3 style='color: #4CAF50; text-align: center; margin-bottom: 20px;'>📋 Work Summary & Invoice</h3>
                            
                            <div style='display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: white; border-radius: 5px;'>
                                <span><strong>Hours Worked:</strong></span>
                                <span>{hoursWorked:F2} hours</span>
                            </div>
                            
                            <div style='display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: white; border-radius: 5px;'>
                                <span><strong>Hourly Rate:</strong></span>
                                <span>₹{hourlyRate:F2} per hour</span>
                            </div>
                            
                            <hr style='border: none; height: 2px; background: #4CAF50; margin: 15px 0;'>
                            
                            <div class='amount-highlight'>
                                <strong>Total Amount: ₹{calculatedAmount:F2}</strong>
                            </div>
                        </div>

                        <div style='background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                            <h4 style='margin-top: 0; color: #2e7d32;'>💡 Next Steps:</h4>
                            <ul style='margin-bottom: 0;'>
                                <li>Review the work completed by your consultant</li>
                                <li>Payment information will be processed separately</li>
                                <li>You can rate your experience with this consultant</li>
                                <li>Feel free to reach out if you have any questions</li>
                            </ul>
                        </div>

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://yuktor.vercel.app/tickets' class='button'>View Details & Rate</a>
                        </div>

                        <p>Thank you for choosing Yuktor for your SAP BASIS support needs. We hope the service met your expectations!</p>

                        <p>Best regards,<br>The Yuktor Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated completion notification from Yuktor - Enterprise SAP BASIS Support Platform</p>
                        <p>© 2025 Yuktor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }

        public static string TicketCompletedForConsultant(string consultantName, string customerName, string orderNumber, string supportType, decimal hoursWorked, decimal hourlyRate, decimal calculatedAmount)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Ticket Completed - Work Summary</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    .summary-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3; }}
                    .earnings-box {{ background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #2196F3; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🎉 Ticket Completed</h1>
                        <p>Work summary and earnings confirmation</p>
                    </div>
                    <div class='content'>
                        <h2>Hello {consultantName},</h2>
                        <p>Congratulations! You have successfully completed the support request. The customer has been notified and provided with the work summary and invoice details.</p>

                        <div class='summary-box'>
                            <h3>Completion Details:</h3>
                            <p><strong>Order Number:</strong> {orderNumber}</p>
                            <p><strong>Customer:</strong> {customerName}</p>
                            <p><strong>Support Type:</strong> {supportType}</p>
                            <p><strong>Status:</strong> <span style='color: #4CAF50; font-weight: bold;'>✅ Completed</span></p>
                        </div>

                        // <div class='earnings-box'>
                        //     <h3 style='color: #1976D2; text-align: center; margin-bottom: 20px;'>💰 Your Earnings Summary</h3>
                            
                        //     <div style='display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: white; border-radius: 5px;'>
                        //         <span><strong>Hours Worked:</strong></span>
                        //         <span>{hoursWorked:F2} hours</span>
                        //     </div>
                            
                        //     <div style='display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: white; border-radius: 5px;'>
                        //         <span><strong>Your Hourly Rate:</strong></span>
                        //         <span>₹{hourlyRate:F2} per hour</span>
                        //     </div>
                            
                        //     <hr style='border: none; height: 2px; background: #2196F3; margin: 15px 0;'>
                            
                        //     <div style='font-size: 20px; font-weight: bold; color: #1976D2; text-align: center; padding: 15px; background: white; border-radius: 8px;'>
                        //         <strong>Total Earned: ₹{calculatedAmount:F2}</strong>
                        //     </div>
                        // </div>

                        <div style='background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <strong>📞 Customer Notification:</strong><br>
                            The customer has been automatically sent an invoice with the work summary and total amount. They can now process payment and rate your service.
                        </div>

                        <p><strong>What happens next:</strong></p>
                        <ul>
                            //<li>Payment processing will be handled by the platform</li>
                            <li>Customer may rate and review your service</li>
                            //<li>Earnings will be processed according to payment terms</li>
                            <li>You can continue accepting new requests</li>
                        </ul>

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://yuktor.vercel.app/dashboard' class='button'>View Dashboard</a>
                        </div>

                        <p>Excellent work! Thank you for providing quality SAP BASIS support.</p>

                        <p>Best regards,<br>The Yuktor Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated completion confirmation from Yuktor - Enterprise SAP BASIS Support Platform</p>
                        <p>© 2025 Yuktor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }

        public static string StatusChangedToPendingCustomerActionForCustomer(string customerName, string orderNumber, string consultantName, string supportType, string? comment = null)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Action Required - Your Support Request</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #f39c12; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    .action-box {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                    .ticket-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>⏳ Action Required</h1>
                        <p>Your consultant needs additional information</p>
                    </div>
                    <div class='content'>
                        <h2>Hello {customerName},</h2>
                        <p>Your SAP BASIS consultant needs additional information or action from you to continue working on your support request.</p>

                        <div class='ticket-box'>
                            <h3>Request Details:</h3>
                            <p><strong>Order Number:</strong> {orderNumber}</p>
                            <p><strong>Support Type:</strong> {supportType}</p>
                            <p><strong>Consultant:</strong> {consultantName}</p>
                            <p><strong>Status:</strong> <span style='color: #f39c12; font-weight: bold;'>⏳ Pending Customer Action</span></p>
                        </div>

                        {(string.IsNullOrEmpty(comment) ? "" : $@"
                        <div class='action-box'>
                            <h4>💬 Message from your consultant:</h4>
                            <p style='font-style: italic; margin: 10px 0;'>""{comment}""</p>
                        </div>
                        ")}

                        <div class='action-box'>
                            <h4>📝 What you need to do:</h4>
                            <ol style='margin: 15px 0;'>
                                <li>Click the button below to access your ticket</li>
                                <li>Review the consultant's message or request</li>
                                <li>Provide the requested information or clarification</li>
                                <li>Add your response in the comments section</li>
                            </ol>
                            <p><strong>⚡ Once you add your response, work will automatically resume!</strong></p>
                        </div>

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://yuktor.vercel.app/tickets?ticket={orderNumber}' class='button'>Respond to Request</a>
                        </div>

                        <p><strong>Why is this important?</strong></p>
                        <ul>
                            <li>Your consultant needs this information to provide accurate support</li>
                            <li>Quick responses help resolve your issue faster</li>
                            <li>Work will resume immediately after your response</li>
                        </ul>

                        <p>Thank you for choosing Yuktor for your SAP BASIS support needs.</p>

                        <p>Best regards,<br>The Yuktor Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated notification from Yuktor - Enterprise SAP BASIS Support Platform</p>
                        <p>© 2025 Yuktor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }

        public static string StatusChangedBackToInProgressFromCustomerResponseForConsultant(string consultantName, string customerName, string orderNumber, string supportType, string customerResponse)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Customer Responded - Work Resumed</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    .response-box {{ background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                    .ticket-box {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>✅ Customer Responded</h1>
                        <p>Work has automatically resumed</p>
                    </div>
                    <div class='content'>
                        <h2>Hello {consultantName},</h2>
                        <p>Great news! The customer has provided the information you requested, and the ticket status has been automatically changed back to ""In Progress"".</p>

                        <div class='ticket-box'>
                            <h3>Request Details:</h3>
                            <p><strong>Order Number:</strong> {orderNumber}</p>
                            <p><strong>Customer:</strong> {customerName}</p>
                            <p><strong>Support Type:</strong> {supportType}</p>
                            <p><strong>Status:</strong> <span style='color: #27ae60; font-weight: bold;'>🔄 In Progress</span></p>
                        </div>

                        <div class='response-box'>
                            <h4>💬 Customer's Response:</h4>
                            <p style='font-style: italic; margin: 10px 0; background: white; padding: 15px; border-radius: 5px;'>""{customerResponse}""</p>
                        </div>

                        <div style='background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                            <strong>📢 Action Required:</strong><br>
                            Please review the customer's response and continue working on their support request. You can access the full conversation in the ticket details.
                        </div>

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://yuktor.vercel.app/tickets?ticket={orderNumber}' class='button'>Continue Working</a>
                        </div>

                        <p><strong>Next Steps:</strong></p>
                        <ul>
                            <li>Review the customer's response thoroughly</li>
                            <li>Continue providing the requested support</li>
                            <li>Update the customer on your progress</li>
                            <li>Mark as completed when finished</li>
                        </ul>

                        <p>Thank you for providing excellent SAP BASIS support through Yuktor!</p>

                        <p>Best regards,<br>The Yuktor Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated notification from Yuktor - Enterprise SAP BASIS Support Platform</p>
                        <p>© 2025 Yuktor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }

        public static string StatusChangedToReopenedForConsultant(string consultantName, string customerName, string orderNumber, string supportType, string? comment = null)
        {
            return $@"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset='utf-8'>
                <title>Ticket Re-opened</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #6f42c1 0%, #8e44ad 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #6f42c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
                    .comment-box {{ background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e6e6e6; margin-top: 10px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🔔 Ticket Re-opened</h1>
                        <p>The customer has re-opened the support request</p>
                    </div>
                    <div class='content'>
                        <h2>Hello {consultantName},</h2>
                        <p>The customer {customerName} has re-opened the support request <strong>#{orderNumber}</strong> (Type: {supportType}). Please review and continue the work.</p>

                        {(string.IsNullOrEmpty(comment) ? "" : $"<div class='comment-box'><h4>Customer Comment:</h4><p style='margin:0;'>{comment}</p></div>")}

                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://yuktor.vercel.app/tickets?ticket={orderNumber}' class='button'>Open Ticket</a>
                        </div>

                        <p><strong>Next steps:</strong></p>
                        <ul>
                            <li>Review the customer's reason for reopening</li>
                            <li>Contact the customer if clarification is needed</li>
                            <li>Update the ticket status and continue work</li>
                        </ul>

                        <p>Best regards,<br>The Yuktor Team</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated notification from Yuktor - Enterprise SAP BASIS Support Platform</p>
                        <p>© 2025 Yuktor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>";
        }
    }
}