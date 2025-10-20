import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import PageLayout from '../components/layout/PageLayout';

export function TicketNumberTemplatesAdmin() {
  return (
    <PageLayout>
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Ticket Number Templates</h1>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>⚠️ This Page is Deprecated</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              Ticket Number Templates are no longer supported. This feature has been removed in favor of a unified ticket generation system.
            </p>
            <div className="mt-4 p-4 bg-white bg-opacity-10 rounded border border-current">
              <h3 className="font-semibold mb-2">What Changed:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All tickets now use a consistent format: <code className="bg-black bg-opacity-20 px-2 py-1 rounded">SRBIL102500013</code></li>
                <li>Format Components: SupportType (2) + Category (2) + SubType (2) + Priority (1) + MonthYear (4) + Sequence (5)</li>
                <li>All ticket generation is handled by SimpleTicketNumberService</li>
                <li>Format is deterministic and consistent regardless of support type or category</li>
              </ul>
            </div>
            
            <div className="mt-4 p-4 bg-white bg-opacity-10 rounded border border-current">
              <h3 className="font-semibold mb-2">Example Format Breakdown:</h3>
              <code className="block text-sm font-mono bg-black bg-opacity-20 p-2 rounded">
                SRBIL102500013
              </code>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li><strong>SR</strong> = Service Request (Support Type)</li>
                <li><strong>BI</strong> = Billing (Category)</li>
                <li><strong>L1</strong> = Level 1 (SubType)</li>
                <li><strong>0</strong> = Normal Priority</li>
                <li><strong>1025</strong> = October 2025 (MMYY)</li>
                <li><strong>00013</strong> = Sequence #13</li>
              </ul>
            </div>

            <p className="mt-4 text-sm">
              This page is maintained for reference only. No template creation, updating, or deletion is supported.
              The old TicketNumberTemplate table in the database will be removed in a future version.
            </p>
          </AlertDescription>
        </Alert>

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">For Developers</h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            To generate ticket numbers programmatically, use <code className="bg-black bg-opacity-10 px-1 py-0.5 rounded">ISimpleTicketNumberService.GenerateTicketNumberAsync()</code>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
