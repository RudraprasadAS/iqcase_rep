
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
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const searchLocation = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    setIsSearching(false);
  };

  const selectSearchResult = (result: any) => {
    const location = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formatted_address: result.display_name
    };
    setSelectedLocation(location);
    setSearchResults([]);
    setSearchAddress('');
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
          <DialogTitle>Pick Location</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search for an address</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter address or location..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              />
              <Button onClick={searchLocation} disabled={isSearching}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Search Results</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => selectSearchResult(result)}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-blue-600 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">{result.display_name}</p>
                        <p className="text-gray-500 text-xs">
                          {parseFloat(result.lat).toFixed(6)}, {parseFloat(result.lon).toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Location Display */}
          <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <MapPin className="h-12 w-12 mx-auto text-blue-600" />
              {selectedLocation?.latitude && selectedLocation?.longitude ? (
                <div className="space-y-2">
                  <p className="font-medium">Selected Location:</p>
                  <p className="text-sm text-gray-700">{selectedLocation.formatted_address}</p>
                  <p className="text-xs text-gray-500">
                    Lat: {selectedLocation.latitude.toFixed(6)}, Lng: {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600">No location selected</p>
                  <p className="text-sm text-gray-500">Search for an address above to select a location</p>
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
