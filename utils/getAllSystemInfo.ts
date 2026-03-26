/**
 * Frontend function to fetch all system information from the API
 * This is safe to call from client components
 */

export const getAllSystemInfo = async () => {
  try {
    const response = await fetch('/api/testAllInfo', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data; // Returns all system information
  } catch (error) {
    console.error('Failed to fetch system info:', error);
    throw error;
  }
};
