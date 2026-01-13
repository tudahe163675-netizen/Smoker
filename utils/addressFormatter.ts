/**
 * Utility functions for formatting and validating address data
 * Standard format: {"detail":"13","provinceId":"1","districtId":"21","wardId":"617"}
 */

export interface AddressObject {
  detail: string;
  provinceId: string;
  districtId: string;
  wardId: string;
}

/**
 * Validates that all 4 required address fields are present
 */
export const validateAddressFields = (
  detail: string | undefined | null,
  provinceId: string | undefined | null,
  districtId: string | undefined | null,
  wardId: string | undefined | null
): boolean => {
  return (
    !!detail &&
    detail.trim() !== '' &&
    !!provinceId &&
    provinceId.trim() !== '' &&
    !!districtId &&
    districtId.trim() !== '' &&
    !!wardId &&
    wardId.trim() !== ''
  );
};

/**
 * Formats address data into standard JSON string format
 * @returns JSON string or null if validation fails
 */
export const formatAddressForSave = (
  detail: string | undefined | null,
  provinceId: string | undefined | null,
  districtId: string | undefined | null,
  wardId: string | undefined | null
): string | null => {
  // Validate all fields are present
  if (!validateAddressFields(detail, provinceId, districtId, wardId)) {
    return null;
  }

  // Create address object with all 4 required fields
  const addressObj: AddressObject = {
    detail: detail!.trim(),
    provinceId: provinceId!.trim(),
    districtId: districtId!.trim(),
    wardId: wardId!.trim()
  };

  // Return as JSON string
  return JSON.stringify(addressObj);
};

/**
 * Parses address from string (JSON or plain string)
 * @returns Parsed address object or null
 */
export const parseAddressFromString = (addressString: string | null | undefined): AddressObject | null => {
  if (!addressString || typeof addressString !== 'string') {
    return null;
  }

  const trimmed = addressString.trim();
  if (!trimmed) {
    return null;
  }

  // If it's a JSON string, try to parse it
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      // Validate it has the required structure
      if (parsed && typeof parsed === 'object' && parsed.detail && parsed.provinceId && parsed.districtId && parsed.wardId) {
        return {
          detail: parsed.detail || '',
          provinceId: parsed.provinceId || '',
          districtId: parsed.districtId || '',
          wardId: parsed.wardId || ''
        };
      }
    } catch (e) {
      console.error('Failed to parse address JSON:', e);
      return null;
    }
  }

  // If it's not JSON, return null (old format, should be migrated)
  return null;
};

/**
 * Extracts address fields from parsed address object
 * @returns Object with detail, provinceId, districtId, wardId
 */
export const extractAddressFields = (addressObj: AddressObject | null | undefined): AddressObject => {
  if (!addressObj || typeof addressObj !== 'object') {
    return {
      detail: '',
      provinceId: '',
      districtId: '',
      wardId: ''
    };
  }

  return {
    detail: addressObj.detail || addressObj.addressDetail || '',
    provinceId: addressObj.provinceId || '',
    districtId: addressObj.districtId || '',
    wardId: addressObj.wardId || ''
  };
};

/**
 * Fetches location name from location API by ID
 */
const fetchLocationName = async (type: 'province' | 'district' | 'ward', id: string, parentId?: string): Promise<string | null> => {
  if (!id) return null;

  try {
    let url: string;
    if (type === 'province') {
      url = `https://open.oapi.vn/location/provinces?page=0&size=100`;
    } else if (type === 'district') {
      if (!parentId) return null;
      url = `https://open.oapi.vn/location/districts/${parentId}?page=0&size=100`;
    } else if (type === 'ward') {
      if (!parentId) return null;
      url = `https://open.oapi.vn/location/wards/${parentId}?page=0&size=100`;
    } else {
      return null;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.code === 'success' && data.data) {
      const items = data.data;
      const found = items.find((item: any) => String(item.id) === String(id));
      return found ? found.name : null;
    }
    return null;
  } catch (error) {
    console.error(`[AddressFormatter] Failed to fetch ${type} name for id ${id}:`, error);
    return null;
  }
};

/**
 * Builds full address string from address object with IDs
 * Fetches location names from API if needed
 */
export const buildAddressFromIds = async (addressObj: AddressObject | null | undefined): Promise<string | null> => {
  if (!addressObj || typeof addressObj !== 'object') {
    return null;
  }

  const detail = addressObj.detail || addressObj.addressDetail || '';
  const provinceId = addressObj.provinceId || '';
  const districtId = addressObj.districtId || '';
  const wardId = addressObj.wardId || '';

  if (!detail || !provinceId || !districtId || !wardId) {
    return null;
  }

  // Fetch location names
  const [provinceName, districtName, wardName] = await Promise.all([
    fetchLocationName('province', provinceId),
    fetchLocationName('district', districtId, provinceId),
    fetchLocationName('ward', wardId, districtId)
  ]);

  // Build address string
  const parts = [
    detail,
    wardName,
    districtName,
    provinceName
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
};

