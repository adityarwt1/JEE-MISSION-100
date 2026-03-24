"use client"
export const getSystemInfo = async ()=>{
    const response = await fetch('/api/system-info');
    if (!response.ok) {
        throw new Error('Failed to fetch system info');
    }
    return await response.json();
}