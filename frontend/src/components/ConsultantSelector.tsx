
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAvailableConsultants } from "@/hooks/useSupport";
import { User } from "lucide-react";

interface ConsultantSelectorProps {
  onConsultantSelect: (consultantId: string) => void;
  selectedConsultant?: string;
}

const ConsultantSelector = ({ onConsultantSelect, selectedConsultant }: ConsultantSelectorProps) => {
  const { data: consultants, isLoading } = useAvailableConsultants();

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="text-center">Loading consultants...</div>
        </CardContent>
      </Card>
    );
  }

  if (!consultants || consultants.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No consultants available at the moment
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-yellow-500">
          <User className="w-5 h-5" />
          <span>Select Consultant</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="consultant">Choose a consultant for your support request *</Label>
            <Select value={selectedConsultant} onValueChange={onConsultantSelect}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select a consultant" />
              </SelectTrigger>
              <SelectContent className="bg-background border-muted">
                {consultants.map(consultant => (
                  <SelectItem key={consultant.id} value={consultant.id}>
                    {consultant.firstName} {consultant.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultantSelector;
