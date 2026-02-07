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
import { type MarkerSettings } from '@/lib/types';
import MarkerPreview from './MarkerPreview';

interface ControlPanelProps {
  settings: MarkerSettings;
  onSettingsChange: (settings: MarkerSettings) => void;
  markerCount: number;
}

export default function ControlPanel({
  settings,
  onSettingsChange,
  markerCount,
}: ControlPanelProps) {
  const handleSettingChange = (key: keyof MarkerSettings, value: string | number) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Marker Settings</CardTitle>
          <Badge>{markerCount} placed</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Preview */}
        <div>
          <Label className="mb-2 block">Preview</Label>
          <MarkerPreview settings={settings} />
        </div>

        <Separator />

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

        <Separator />

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

        <Separator />

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
      </CardContent>
    </Card>
  );
}
