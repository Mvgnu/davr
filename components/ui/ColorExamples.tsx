import React from 'react';
import { 
  GREEN_COLORS, 
  BLUE_COLORS, 
  STATUS_COLORS, 
  BUTTON_STYLES, 
  TEXT_COLORS,
  GRADIENTS 
} from '@/lib/constants/colors';

/**
 * Component that demonstrates all the standardized colors
 * Used for documentation and design reference
 */
export const ColorExamples = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Color System Examples</h1>
      
      {/* Primary Colors (Green) */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Primary Colors (Green)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(GREEN_COLORS).map(([shade, hex]) => (
            <div key={shade} className="flex flex-col">
              <div 
                className={`h-20 rounded-t-lg bg-green-${shade}`} 
                style={{ backgroundColor: hex }}
              ></div>
              <div className="bg-white p-3 border border-gray-200 rounded-b-lg">
                <p className="font-medium">Green {shade}</p>
                <p className="text-xs text-gray-500">{hex}</p>
                <p className="text-xs font-mono">bg-green-{shade}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Secondary Colors (Blue) */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Secondary Colors (Blue)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(BLUE_COLORS).map(([shade, hex]) => (
            <div key={shade} className="flex flex-col">
              <div 
                className={`h-20 rounded-t-lg bg-blue-${shade}`} 
                style={{ backgroundColor: hex }}
              ></div>
              <div className="bg-white p-3 border border-gray-200 rounded-b-lg">
                <p className="font-medium">Blue {shade}</p>
                <p className="text-xs text-gray-500">{hex}</p>
                <p className="text-xs font-mono">bg-blue-{shade}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Status Colors */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Status Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(STATUS_COLORS).map(([status, classes]) => (
            <div key={status} className="flex flex-col">
              <div className={`p-4 rounded-lg ${classes.bg} ${classes.text} ${classes.border}`}>
                <p className="capitalize font-medium">{status}</p>
                <p className="text-xs mt-1">This is a {status} message</p>
              </div>
              <div className="mt-2">
                <p className="text-xs font-mono">{classes.bg}</p>
                <p className="text-xs font-mono">{classes.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Button Styles */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Button Styles</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(BUTTON_STYLES).map(([name, classes]) => (
            <button 
              key={name}
              className={`px-4 py-2 rounded-lg ${classes}`}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)} Button
            </button>
          ))}
        </div>
      </section>
      
      {/* Text Colors */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Text Colors</h2>
        <div className="space-y-2">
          {Object.entries(TEXT_COLORS).map(([name, classes]) => (
            <p key={name} className={`text-lg ${classes}`}>
              This text uses {name} color ({classes})
            </p>
          ))}
        </div>
      </section>
      
      {/* Gradients */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Gradients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(GRADIENTS).map(([name, classes]) => (
            <div key={name} className={`h-20 rounded-lg ${classes} p-4`}>
              <p className="text-white font-medium">{name}</p>
              <p className="text-white/80 text-xs font-mono">{classes}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Example UI Components */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Example UI Components</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Example */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="h-40 bg-green-100"></div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2">Card Title</h3>
              <p className="text-gray-700 mb-4">This is an example card using our standardized color system.</p>
              <div className="flex justify-between">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Tag
                </span>
                <button className={BUTTON_STYLES.primary + " px-3 py-1 rounded"}>
                  Action
                </button>
              </div>
            </div>
          </div>
          
          {/* Alert Example */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-1">Warning Alert</h4>
            <p className="text-yellow-700 text-sm">This is an example warning alert using our standardized color system.</p>
          </div>
          
          {/* Form Example */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Form Example</h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Input Label
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                placeholder="Input example" 
              />
            </div>
            <div className="flex items-center mb-4">
              <input 
                type="checkbox" 
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" 
              />
              <label className="ml-2 block text-sm text-gray-700">
                Checkbox example
              </label>
            </div>
            <button className={BUTTON_STYLES.primary + " w-full py-2 rounded-lg"}>
              Submit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ColorExamples; 