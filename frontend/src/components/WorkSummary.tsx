import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, CheckCircle, User } from 'lucide-react';

interface WorkSummaryProps {
  ticket: {
    status: string;
    consultantName: string;
    hoursWorked?: number | null;
    hourlyRateAtCompletion?: number | null;
    calculatedAmount?: number | null;
    consultantHourlyRate?: number | null;
  };
  userRole?: string;
}

const WorkSummary: React.FC<WorkSummaryProps> = ({ ticket, userRole }) => {
  const isCompleted = ticket.status === 'Completed' || ticket.status === 'Closed' || ticket.status === 'TopicClosed';
  const hasWorkData = ticket.hoursWorked && ticket.hourlyRateAtCompletion && ticket.calculatedAmount;

  // If not completed or no work data, don't show the component
  if (!isCompleted || !hasWorkData) {
    return null;
  }

  return (
    <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
          <CheckCircle className="w-5 h-5" />
          <span>Work Summary</span>
          <Badge variant="outline" className="ml-auto bg-green-100 text-green-800 border-green-300">
            Completed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Consultant Info */}
        <div className="flex items-center space-x-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Consultant:</span>
          <span className="font-medium">{ticket.consultantName}</span>
        </div>

        {/* Work Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Hours Worked</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {ticket.hoursWorked.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">hours</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Hourly Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ₹{ticket.hourlyRateAtCompletion.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">per hour</p>
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Amount</p>
              <p className="text-3xl font-bold">
                ₹{ticket.calculatedAmount.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 opacity-75" />
          </div>
          <div className="mt-2 text-xs opacity-75">
            {ticket.hoursWorked.toFixed(1)} hours × ₹{ticket.hourlyRateAtCompletion.toFixed(2)} = ₹{ticket.calculatedAmount.toFixed(2)}
          </div>
        </div>

        {/* Customer/Consultant specific messages */}
        {userRole === 'customer' && (
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💳 <strong>Invoice Details:</strong> This is your final invoice for the completed work. 
              Payment processing information will be sent separately.
            </p>
          </div>
        )}

        {/* {userRole === 'consultant' && (
          <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              💰 <strong>Earnings Summary:</strong> Your work has been completed and the customer has been invoiced. 
              Earnings will be processed according to payment terms.
            </p>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
};

export default WorkSummary;