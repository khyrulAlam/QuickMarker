import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Palette, Type, Hash, RotateCcw } from 'lucide-react';
import { type MarkerSettings } from '@/lib/types';
import MarkerPreview from './MarkerPreview';

interface ControlPanelProps {
  settings: MarkerSettings;
  onSettingsChange: (settings: MarkerSettings) => void;
  markerCount: number;
  onResetCount: () => void;
}

export default function ControlPanel({
  settings,
  onSettingsChange,
  markerCount,
  onResetCount,
}: ControlPanelProps) {
  // State for controlling which sections are open
  const [openSections, setOpenSections] = useState({
    style: true,  // Shape & Style section open by default
    text: false,
    count: false,
  });

  const handleSettingChange = (key: keyof MarkerSettings, value: string | number | boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <Card className="w-80 bg-card/90 backdrop-blur-md border shadow-lg">
      <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto p-6 scrollbar-hide">
        {/* Live Preview */}
        <div>
          <Label className="mb-2 block">Preview</Label>
          <MarkerPreview settings={settings} />
        </div>

        <Separator />

        {/* Shape & Style Section */}
        <Collapsible open={openSections.style} onOpenChange={() => toggleSection('style')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-0 h-auto">
              <div className="flex items-center gap-2 py-2">
                {openSections.style ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Palette className="h-4 w-4" />
                <span className="font-medium">Shape & Style</span>
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-2">
            {/* Shape Selection */}
            <div className="space-y-2">
              <Label htmlFor="shape">Shape</Label>
              <Select
                value={settings.shape}
                onValueChange={(value) => handleSettingChange('shape', value)}
              >
                <SelectTrigger id="shape" aria-label="Select marker shape">
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Size Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="size">Size</Label>
                <span className="text-sm text-muted-foreground">{settings.size}px</span>
              </div>
              <Slider
                id="size"
                min={10}
                max={50}
                step={1}
                value={[settings.size]}
                onValueChange={(value) => handleSettingChange('size', value[0])}
                aria-label="Marker size"
              />
            </div>

            {/* Fill Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Fill Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={settings.color}
                  onChange={(e) => handleSettingChange('color', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                  aria-label="Marker fill color"
                />
                <Input
                  type="text"
                  value={settings.color}
                  onChange={(e) => handleSettingChange('color', e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#000000"
                  aria-label="Marker fill color hex value"
                />
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="opacity">Fill Opacity</Label>
                <span className="text-sm text-muted-foreground">{settings.opacity}%</span>
              </div>
              <Slider
                id="opacity"
                min={0}
                max={100}
                step={5}
                value={[settings.opacity]}
                onValueChange={(value) => handleSettingChange('opacity', value[0])}
                aria-label="Marker fill opacity"
              />
            </div>

            {/* Border Size Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="borderSize">Border Width</Label>
                <span className="text-sm text-muted-foreground">{settings.borderSize}px</span>
              </div>
              <Slider
                id="borderSize"
                min={1}
                max={5}
                step={1}
                value={[settings.borderSize]}
                onValueChange={(value) => handleSettingChange('borderSize', value[0])}
                aria-label="Marker border width"
              />
            </div>

            {/* Border Color */}
            <div className="space-y-2">
              <Label htmlFor="borderColor">Border Color</Label>
              <div className="flex gap-2">
                <Input
                  id="borderColor"
                  type="color"
                  value={settings.borderColor}
                  onChange={(e) => handleSettingChange('borderColor', e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                  aria-label="Marker border color"
                />
                <Input
                  type="text"
                  value={settings.borderColor}
                  onChange={(e) => handleSettingChange('borderColor', e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#000000"
                  aria-label="Marker border color hex value"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Text Options Section */}
        <Collapsible open={openSections.text} onOpenChange={() => toggleSection('text')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-0 h-auto">
              <div className="flex items-center gap-2 py-2">
                {openSections.text ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Type className="h-4 w-4" />
                <span className="font-medium">Text Options</span>
                {settings.showText && <Badge variant="secondary" className="ml-auto">Active</Badge>}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showText"
                checked={settings.showText}
                onCheckedChange={(checked) => handleSettingChange('showText', checked === true)}
              />
              <Label htmlFor="showText" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Show text in markers
              </Label>
            </div>

            {settings.showText && (
              <div className="space-y-4 pl-6">
                {/* Text Input */}
                <div className="space-y-2">
                  <Label htmlFor="text">Text</Label>
                  <Input
                    id="text"
                    type="text"
                    value={settings.text}
                    onChange={(e) => handleSettingChange('text', e.target.value)}
                    placeholder="Enter text for markers"
                    aria-label="Marker text"
                  />
                </div>

                {/* Text Color */}
                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={settings.textColor}
                      onChange={(e) => handleSettingChange('textColor', e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                      aria-label="Text color"
                    />
                    <Input
                      type="text"
                      value={settings.textColor}
                      onChange={(e) => handleSettingChange('textColor', e.target.value)}
                      className="flex-1 font-mono"
                      placeholder="#ffffff"
                      aria-label="Text color hex value"
                    />
                  </div>
                </div>

                {/* Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <span className="text-sm text-muted-foreground">{settings.fontSize}px</span>
                  </div>
                  <Slider
                    id="fontSize"
                    min={8}
                    max={24}
                    step={1}
                    value={[settings.fontSize]}
                    onValueChange={(value) => handleSettingChange('fontSize', value[0])}
                    aria-label="Text font size"
                  />
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Count Options Section */}
        <Collapsible open={openSections.count} onOpenChange={() => toggleSection('count')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-0 h-auto">
              <div className="flex items-center gap-2 py-2">
                {openSections.count ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Hash className="h-4 w-4" />
                <span className="font-medium">Count Options</span>
                {settings.showCount && <Badge variant="secondary" className="ml-auto">Active</Badge>}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showCount"
                checked={settings.showCount}
                onCheckedChange={(checked) => handleSettingChange('showCount', checked === true)}
              />
              <Label htmlFor="showCount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Show count numbers in markers
              </Label>
            </div>

            {settings.showCount && (
              <div className="space-y-4 pl-6">
                {/* Count Color */}
                <div className="space-y-2">
                  <Label htmlFor="countColor">Count Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="countColor"
                      type="color"
                      value={settings.countColor}
                      onChange={(e) => handleSettingChange('countColor', e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                      aria-label="Count color"
                    />
                    <Input
                      type="text"
                      value={settings.countColor}
                      onChange={(e) => handleSettingChange('countColor', e.target.value)}
                      className="flex-1 font-mono"
                      placeholder="#ffffff"
                      aria-label="Count color hex value"
                    />
                  </div>
                </div>

                {/* Start Count From */}
                <div className="space-y-2">
                  <Label htmlFor="countStartFrom">Start Count From</Label>
                  <Input
                    id="countStartFrom"
                    type="number"
                    min={0}
                    max={999}
                    value={settings.countStartFrom}
                    onChange={(e) => handleSettingChange('countStartFrom', parseInt(e.target.value) || 1)}
                    className="w-full"
                    aria-label="Starting count number"
                  />
                </div>

                {/* Count Font Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="countFontSize">Count Font Size</Label>
                    <span className="text-sm text-muted-foreground">{settings.countFontSize}px</span>
                  </div>
                  <Slider
                    id="countFontSize"
                    min={8}
                    max={24}
                    step={1}
                    value={[settings.countFontSize]}
                    onValueChange={(value) => handleSettingChange('countFontSize', value[0])}
                    aria-label="Count font size"
                  />
                </div>

                {/* Reset Count Button */}
                <div className="space-y-2">
                  <Button
                    onClick={onResetCount}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={markerCount === 0}
                    aria-label="Reset count numbers"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Count
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Reset count numbers to sequential order (1, 2, 3, ...)
                  </p>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}