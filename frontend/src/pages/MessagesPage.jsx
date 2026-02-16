import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { MessageSquare } from 'lucide-react';

const MessagesPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <Card className="p-12 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No messages yet</p>
        <p className="text-sm text-gray-400 mt-2">Messages from vendors will appear here</p>
      </Card>
    </div>
  );
};

export default MessagesPage;
