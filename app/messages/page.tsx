'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageList } from '@/components/messages/MessageList';
import { MessageForm } from '@/components/messages/MessageForm';
import { Message } from '@/components/messages/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Mail, Send, Inbox } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch messages
  const fetchMessages = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(`/api/user/messages?type=${activeTab}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Nachrichten');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setMessages(result.data);
        setFilteredMessages(result.data); // Initially show all messages
      } else {
        throw new Error(result.error || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Laden der Nachrichten');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter messages based on status
  const filterMessages = (statusFilter: string | null) => {
    if (!statusFilter) {
      setFilteredMessages(messages);
    } else {
      setFilteredMessages(messages.filter(msg => msg.status === statusFilter));
    }
  };

  // Refresh messages on tab change
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchMessages();
    }
  }, [activeTab, status, session]);

  // Set up automatic refresh every 30 seconds
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const interval = setInterval(() => {
        fetchMessages(true);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [status, session]);

  const handleManualRefresh = () => {
    fetchMessages(true);
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-muted rounded-lg p-4">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Nachrichten</h1>
          <p className="text-muted-foreground mb-6">
            Sie müssen angemeldet sein, um Ihre Nachrichten zu sehen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Nachrichten
          </h1>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Aktualisieren...' : 'Aktualisieren'}
          </button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nachrichtenfilter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <button 
                onClick={() => filterMessages(null)}
                className={`px-3 py-1 rounded-full text-sm ${!messages.some(msg => msg.status !== 'new' && msg.status !== 'sent' && msg.status !== 'failed') ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                Alle
              </button>
              <button 
                onClick={() => filterMessages('new')}
                className={`px-3 py-1 rounded-full text-sm ${messages.some(msg => msg.status === 'new') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
              >
                Neu
              </button>
              <button 
                onClick={() => filterMessages('sent')}
                className={`px-3 py-1 rounded-full text-sm ${messages.some(msg => msg.status === 'sent') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
              >
                Gesendet
              </button>
              <button 
                onClick={() => filterMessages('failed')}
                className={`px-3 py-1 rounded-full text-sm ${messages.some(msg => msg.status === 'failed') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
              >
                Fehlgeschlagen
              </button>
            </div>

            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Alle
                </TabsTrigger>
                <TabsTrigger value="received" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Empfangen
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Gesendet
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mb-8">
          <MessageList 
            messages={filteredMessages} 
            isLoading={loading}
            emptyState={
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Keine Nachrichten</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'sent' 
                    ? 'Sie haben noch keine Nachrichten gesendet.' 
                    : activeTab === 'received'
                    ? 'Sie haben noch keine Nachrichten erhalten.'
                    : 'Sie haben noch keine Nachrichten.'}
                </p>
              </div>
            }
          />
        </div>

        <div className="mt-8">
          <MessageForm 
            onSend={() => fetchMessages(true)}
            initialSubject={`Re: Neue Anfrage`}
          />
        </div>
      </div>
    </div>
  );
}