import React, { useEffect } from 'react';

const IconGenerator: React.FC = () => {
  useEffect(() => {
    const generatePNGIcon = (size: number, filename: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Create a simple icon programmatically
      // Background
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(0, 0, size, size);
      
      // Add rounded corners
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, size * 0.15);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      
      // SAP BASIS bars (scaled for size)
      const scale = size / 192;
      ctx.fillStyle = 'white';
      
      // Draw bars
      const bars = [
        { x: 24 * scale, y: 36 * scale, width: 8 * scale, height: 56 * scale },
        { x: 40 * scale, y: 28 * scale, width: 8 * scale, height: 72 * scale },
        { x: 56 * scale, y: 20 * scale, width: 8 * scale, height: 88 * scale },
        { x: 72 * scale, y: 32 * scale, width: 8 * scale, height: 64 * scale },
        { x: 88 * scale, y: 44 * scale, width: 8 * scale, height: 40 * scale },
        { x: 104 * scale, y: 52 * scale, width: 8 * scale, height: 24 * scale }
      ];
      
      bars.forEach(bar => {
        ctx.beginPath();
        ctx.roundRect(bar.x, bar.y, bar.width, bar.height, bar.width / 2);
        ctx.fill();
      });
      
      // Pulse wave
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(16 * scale, 96 * scale);
      ctx.lineTo(24 * scale, 96 * scale);
      ctx.lineTo(28 * scale, 80 * scale);
      ctx.lineTo(36 * scale, 112 * scale);
      ctx.lineTo(44 * scale, 64 * scale);
      ctx.lineTo(52 * scale, 96 * scale);
      ctx.lineTo(112 * scale, 96 * scale);
      ctx.stroke();
      
      // Add text if size is large enough
      if (size >= 192) {
        ctx.fillStyle = 'white';
        ctx.font = `${14 * scale}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('SAP BASIS', size / 2, size - 24 * scale);
      }
      
      // Convert to blob and download (for manual saving)
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    };
    
    // Auto-generate icons after component mounts
    setTimeout(() => {
      generatePNGIcon(192, 'icon-192x192.png');
      setTimeout(() => generatePNGIcon(512, 'icon-512x512.png'), 1000);
    }, 2000);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-3 rounded">
      <div className="text-sm">
        PNG icons will be auto-downloaded in 2 seconds...
        <br />
        Save them to: <code>public/icons/</code>
      </div>
    </div>
  );
};

export default IconGenerator;