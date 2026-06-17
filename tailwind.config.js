/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        walnut: {
          50: "#F7F3EE",
          100: "#EADFD1",
          200: "#D4BEA1",
          300: "#B99870",
          400: "#9A7149",
          500: "#7B5435",
          600: "#5D4037",
          700: "#4A332C",
          800: "#3A2823",
          900: "#2B1E1B",
        },
        copper: {
          50: "#FBF6EA",
          100: "#F2E3BE",
          200: "#E6CE8B",
          300: "#D9B85A",
          400: "#C9A961",
          500: "#B0893E",
          600: "#8A6A2F",
          700: "#665024",
        },
        cream: {
          50: "#FDFBF7",
          100: "#FAF7F2",
          200: "#F4EDE0",
        },
        status: {
          placed: "#6B7280",
          producing: "#3B82F6",
          shipped: "#8B5CF6",
          installing: "#F59E0B",
          completed: "#10B981",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', "sans-serif"],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', '"SimSun"', "serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(93, 64, 55, 0.08)",
        cardHover: "0 8px 28px rgba(93, 64, 55, 0.15)",
        copper: "0 2px 12px rgba(201, 169, 97, 0.25)",
      },
      backgroundImage: {
        "walnut-gradient":
          "linear-gradient(135deg, #5D4037 0%, #7B5435 50%, #4A332C 100%)",
        "copper-gradient":
          "linear-gradient(135deg, #C9A961 0%, #E6CE8B 50%, #B0893E 100%)",
        "card-gradient":
          "linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
