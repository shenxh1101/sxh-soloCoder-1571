import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  Home,
} from "lucide-react";

const navItems = [
  {
    path: "/",
    label: "仪表盘",
    icon: LayoutDashboard,
  },
  {
    path: "/orders",
    label: "订单管理",
    icon: ClipboardList,
  },
  {
    path: "/customers",
    label: "客户管理",
    icon: Users,
  },
  {
    path: "/statistics",
    label: "统计报表",
    icon: BarChart3,
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 bg-white/80 backdrop-blur-sm border-r border-walnut-100 p-4 flex flex-col">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-walnut-gradient flex items-center justify-center shadow-copper">
              <Home className="w-6 h-6 text-copper-200" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-walnut-800 leading-tight">
                门窗管家
              </h1>
              <p className="text-xs text-walnut-400">订单管理系统</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "sidebar-item-active" : ""}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-walnut-100">
          <div className="px-3 py-3 rounded-xl bg-cream-100/60">
            <p className="text-xs text-walnut-500 mb-1">本地存储</p>
            <p className="text-xs text-walnut-400 leading-relaxed">
              所有数据保存在浏览器中，安全可靠
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto scrollbar-thin">
        <div className="min-h-screen p-8">{children}</div>
      </main>
    </div>
  );
}
