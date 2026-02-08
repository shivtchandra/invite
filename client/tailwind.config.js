/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glass: "0 20px 45px -20px rgba(10, 22, 40, 0.65)"
      },
      colors: {
        ink: "#0f172a",
        cloud: "#f8fafc",
        ember: "#f97316"
      }
    }
  },
  plugins: []
};

