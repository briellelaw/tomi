import { useState } from "react";

type Tab = {
  name: string;
  content: React.ReactNode;
};

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].name);
  return (
    <>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map(({ name }) => (
          <button
            key={name}
            onClick={() => setActive(name)}
            className={`flex-1 py-2 font-medium capitalize ${
              active === name
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-primary"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      {tabs.find((t) => t.name === active)?.content}
    </>
  );
}
