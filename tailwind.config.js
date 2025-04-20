/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./views/**/*.hbs",
      "./views/*.hbs",
      "./public/**/*.js",
      "./app.js"
    ],
    theme: {
      extend: {
        colors: {
          primary: '#4f46e5', // indigo-600
        }
      },
    },
    plugins: [],
    safelist: [
      'bg-primary', // Force include this class
      'text-white'  // Always include this utility
    ],

    future: {
        hoverOnlyWhenSupported: true,
      },
      experimental: {
        optimizeUniversalDefaults: true
      }
  }