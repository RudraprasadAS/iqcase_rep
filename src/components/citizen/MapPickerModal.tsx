
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search } from 'lucide-react';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { latitude: number; longitude: number; formatted_address: string }) => void;
  currentLocation?: { latitude: number | null; longitude: number | null; formatted_address: string };
}

const MapPickerModal = ({ isOpen, onClose, onLocationSelect, currentLocation }: MapPickerModalProps) => {
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(currentLocation);
  const [isSearching, setIsSearching] = useState(false);

  const searchLocation = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        setSelectedLocation({
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formatted_address: result.display_name
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    setIsSearching(false);
  };

  const handleConfirm = () => {
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pick Location on Map</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for an address..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            />
            <Button onClick={searchLocation} disabled={isSearching}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Simple map placeholder with coordinates */}
          <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <MapPin className="h-12 w-12 mx-auto text-blue-600" />
              <p className="text-sm text-gray-600">Interactive map would be here</p>
              {selectedLocation?.latitude && selectedLocation?.longitude && (
                <div className="space-y-2">
                  <p className="font-medium">Selected Location:</p>
                  <p className="text-sm">{selectedLocation.formatted_address}</p>
                  <p className="text-xs text-gray-500">
                    Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!selectedLocation?.latitude || !selectedLocation?.longitude}
            >
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapPickerModal;
