import { Metadata } from 'next';
import { Save, Shield, Globe, Bell, Mail, Users, Database, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const metadata: Metadata = {
  title: 'Einstellungen | Admin Dashboard | DAVR',
  description: 'Konfigurieren Sie die DAVR-Plattform nach Ihren Anforderungen.',
};

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Plattform-Einstellungen</h1>
        <p className="text-gray-600 mt-1">Konfigurieren Sie DAVR nach Ihren Bedürfnissen</p>
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="security">Sicherheit</TabsTrigger>
          <TabsTrigger value="email">E-Mail</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          <TabsTrigger value="content">Inhalt</TabsTrigger>
          <TabsTrigger value="api">API & Integration</TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Allgemeine Einstellungen</CardTitle>
              <CardDescription>
                Grundlegende Konfiguration der DAVR-Plattform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="site-name">Plattformname</Label>
                <Input id="site-name" defaultValue="DAVR - Die Alternative Verwertungsroute" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site-description">Beschreibung</Label>
                <Textarea 
                  id="site-description" 
                  defaultValue="DAVR ist Deutschlands erste digitale Plattform für die Vermittlung von Recycling-Materialien und -Dienstleistungen." 
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-email">Kontakt-E-Mail</Label>
                <Input id="contact-email" type="email" defaultValue="info@davr.de" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maintenance-mode">Wartungsmodus</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="maintenance-mode" />
                  <Label htmlFor="maintenance-mode">Plattform im Wartungsmodus</Label>
                </div>
                <p className="text-sm text-gray-500">Im Wartungsmodus ist die Plattform nur für Administratoren zugänglich.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Standardsprache</Label>
                <Select defaultValue="de">
                  <SelectTrigger>
                    <SelectValue placeholder="Sprache auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">Englisch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Einstellungen speichern
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sicherheitseinstellungen</CardTitle>
              <CardDescription>
                Sicherheits- und Zugriffseinstellungen für die Plattform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password-policy">Passwort-Richtlinie</Label>
                <Select defaultValue="strong">
                  <SelectTrigger>
                    <SelectValue placeholder="Richtlinie auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (min. 8 Zeichen)</SelectItem>
                    <SelectItem value="medium">Medium (min. 10 Zeichen, 1 Zahl)</SelectItem>
                    <SelectItem value="strong">Stark (min. 12 Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Sitzungs-Timeout (Minuten)</Label>
                <Input id="session-timeout" type="number" defaultValue="60" min="5" max="1440" />
                <p className="text-sm text-gray-500">Zeit in Minuten, nach der inaktive Benutzer automatisch abgemeldet werden.</p>
              </div>
              
              <div className="space-y-2">
                <Label>Zwei-Faktor-Authentifizierung</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="2fa-admins" defaultChecked />
                  <Label htmlFor="2fa-admins">Pflicht für Administratoren</Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch id="2fa-users" />
                  <Label htmlFor="2fa-users">Optional für alle Benutzer</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>API-Zugriff</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="api-access" defaultChecked />
                  <Label htmlFor="api-access">API-Zugriff aktivieren</Label>
                </div>
                <p className="text-sm text-gray-500">Ermöglicht externen Anwendungen den Zugriff auf die Plattform via API.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Shield className="mr-2 h-4 w-4" />
                Sicherheitseinstellungen speichern
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>E-Mail-Einstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie die E-Mail-Versandeinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email-provider">E-Mail-Anbieter</Label>
                <Select defaultValue="smtp">
                  <SelectTrigger>
                    <SelectValue placeholder="Anbieter auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP Server</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailchimp">Mailchimp</SelectItem>
                    <SelectItem value="ses">Amazon SES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Server</Label>
                <Input id="smtp-host" defaultValue="smtp.example.com" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input id="smtp-port" defaultValue="587" type="number" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-security">Sicherheit</Label>
                  <Select defaultValue="tls">
                    <SelectTrigger>
                      <SelectValue placeholder="Verschlüsselung wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="tls">TLS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp-username">Benutzername</Label>
                <Input id="smtp-username" defaultValue="noreply@davr.de" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smtp-password">Passwort</Label>
                <Input id="smtp-password" type="password" defaultValue="••••••••••••" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sender-name">Absendername</Label>
                <Input id="sender-name" defaultValue="DAVR Platform" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sender-email">Absender-E-Mail</Label>
                <Input id="sender-email" defaultValue="noreply@davr.de" type="email" />
              </div>
              
              <div className="pt-4">
                <Button variant="outline">
                  Test-E-Mail senden
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Mail className="mr-2 h-4 w-4" />
                E-Mail-Einstellungen speichern
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungseinstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie, welche Benachrichtigungen gesendet werden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Benutzerbenachrichtigungen</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-new-account">Neue Kontoerstellung</Label>
                      <p className="text-sm text-gray-500">E-Mail-Bestätigung bei neuer Registrierung</p>
                    </div>
                    <Switch id="notify-new-account" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-password-reset">Passwort-Zurücksetzung</Label>
                      <p className="text-sm text-gray-500">E-Mail bei Passwort-Zurücksetzungsanfragen</p>
                    </div>
                    <Switch id="notify-password-reset" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-account-login">Neue Anmeldung</Label>
                      <p className="text-sm text-gray-500">Benachrichtigung bei Login von neuem Gerät</p>
                    </div>
                    <Switch id="notify-account-login" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Marktplatz-Benachrichtigungen</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-new-listing">Neue Angebote</Label>
                      <p className="text-sm text-gray-500">Benachrichtigung bei neuen Marktplatzangeboten</p>
                    </div>
                    <Switch id="notify-new-listing" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-listing-expiry">Ablaufende Angebote</Label>
                      <p className="text-sm text-gray-500">Erinnerung vor Ablauf eines Angebots</p>
                    </div>
                    <Switch id="notify-listing-expiry" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-new-message">Neue Nachrichten</Label>
                      <p className="text-sm text-gray-500">Benachrichtigung bei neuen Nachrichten</p>
                    </div>
                    <Switch id="notify-new-message" defaultChecked />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Admin-Benachrichtigungen</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-verification-request">Verifizierungsanfragen</Label>
                      <p className="text-sm text-gray-500">Benachrichtigung bei neuen Verifizierungsanfragen</p>
                    </div>
                    <Switch id="notify-verification-request" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-reported-content">Gemeldete Inhalte</Label>
                      <p className="text-sm text-gray-500">Benachrichtigung bei gemeldeten Inhalten</p>
                    </div>
                    <Switch id="notify-reported-content" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notify-system-errors">Systemfehler</Label>
                      <p className="text-sm text-gray-500">Benachrichtigung bei kritischen Systemfehlern</p>
                    </div>
                    <Switch id="notify-system-errors" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Bell className="mr-2 h-4 w-4" />
                Benachrichtigungseinstellungen speichern
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Content Settings */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Inhaltseinstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie Inhalts- und Moderationseinstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="content-moderation">Inhaltsmoderation</Label>
                <Select defaultValue="manual">
                  <SelectTrigger>
                    <SelectValue placeholder="Moderationstyp wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine (nicht empfohlen)</SelectItem>
                    <SelectItem value="auto">Automatisch</SelectItem>
                    <SelectItem value="manual">Manuell</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Auto + Manual)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Bestimmt, wie neue Inhalte auf der Plattform moderiert werden.</p>
              </div>
              
              <div className="space-y-2">
                <Label>Automatische Moderation</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="check-profanity" defaultChecked />
                  <Label htmlFor="check-profanity">Unangemessene Sprache prüfen</Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch id="check-spam" defaultChecked />
                  <Label htmlFor="check-spam">Spam erkennen</Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch id="check-images" defaultChecked />
                  <Label htmlFor="check-images">Bilder prüfen</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="blocked-keywords">Blockierte Schlüsselwörter</Label>
                <Textarea 
                  id="blocked-keywords" 
                  placeholder="Ein Schlüsselwort pro Zeile eingeben..."
                  rows={3}
                />
                <p className="text-sm text-gray-500">Inhalte mit diesen Wörtern werden zur Moderation markiert.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default-listing-duration">Standardlaufzeit für Angebote (Tage)</Label>
                <Input id="default-listing-duration" type="number" defaultValue="30" min="1" max="90" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-images-per-listing">Max. Bilder pro Angebot</Label>
                <Input id="max-images-per-listing" type="number" defaultValue="10" min="1" max="30" />
              </div>
              
              <div className="space-y-2">
                <Label>Angebote</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="require-verification-listing" />
                  <Label htmlFor="require-verification-listing">Verifizierung für Angebote erforderlich</Label>
                </div>
                <p className="text-sm text-gray-500">Wenn aktiviert, können nur verifizierte Benutzer neue Angebote erstellen.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Globe className="mr-2 h-4 w-4" />
                Inhaltseinstellungen speichern
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* API & Integration Settings */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API & Integration</CardTitle>
              <CardDescription>
                Verwalten Sie API-Schlüssel und externe Integrationen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-status">API-Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="api-status" defaultChecked />
                  <Label htmlFor="api-status">Öffentliche API aktivieren</Label>
                </div>
                <p className="text-sm text-gray-500">Ermöglicht externen Anwendungen den Zugriff auf die DAVR-API.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-key">API-Schlüssel</Label>
                <div className="flex space-x-2">
                  <Input id="api-key" value="davr_api_8f7d3e2c1a5b9" readOnly className="flex-grow font-mono" />
                  <Button variant="outline" size="sm">Neu generieren</Button>
                </div>
                <p className="text-sm text-gray-500">Dieser Schlüssel ist erforderlich für API-Zugriff.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-rate-limit">API Rate Limit (Anfragen/Minute)</Label>
                <Input id="api-rate-limit" type="number" defaultValue="60" min="10" max="1000" />
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">Externe Integrationen</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-maps-api">Google Maps API-Schlüssel</Label>
                    <Input id="google-maps-api" placeholder="API-Schlüssel eingeben..." />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="google-analytics">Google Analytics Tracking-ID</Label>
                    <Input id="google-analytics" placeholder="GA-XXXXX" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Social Media Integration</Label>
                    <div className="flex items-center space-x-2">
                      <Switch id="enable-social-login" defaultChecked />
                      <Label htmlFor="enable-social-login">Social Login aktivieren</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storage-provider">Speicheranbieter für Uploads</Label>
                    <Select defaultValue="local">
                      <SelectTrigger>
                        <SelectValue placeholder="Anbieter auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Lokaler Speicher</SelectItem>
                        <SelectItem value="s3">Amazon S3</SelectItem>
                        <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                        <SelectItem value="azure">Azure Blob Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Database className="mr-2 h-4 w-4" />
                API & Integrationseinstellungen speichern
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 