import type { ReactNode } from "react";
import { App, ConfigProvider } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";

/**
 * antd theme for every page that uses antd. Loaded lazily (see App.tsx), so
 * the landing page ships without antd. `app={false}` skips antd's <App>
 * wrapper (message/modal context) for small islands like the header menus.
 */
export default function ThemeProvider({ children, app = true }: { children: ReactNode; app?: boolean }) {
  // antd styles go in their own cascade layer (ordered in index.css) so
  // Tailwind utilities can override them without !important.
  return (
    <StyleProvider layer>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#1a3636",
            colorLink: "#1a3636",
            colorLinkHover: "#c97a12",
            colorText: "#102525",
            colorTextSecondary: "#5b6966",
            colorBorder: "#e3dccd",
            colorBorderSecondary: "#ece6da",
            colorBgContainer: "#fffdf9",
            colorBgLayout: "#f7f4ee",
            colorError: "#b8483e",
            colorSuccess: "#2f7a57",
            colorWarning: "#a05f08",
            borderRadius: 12,
            fontFamily: '"Instrument Sans Variable", "Segoe UI Variable Text", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
            fontSize: 15,
            colorTextPlaceholder: "#8a9592",
            controlOutline: "rgba(240, 164, 58, 0.25)",
            colorBgElevated: "#fffdf9",
            // Popups (select menus, dropdowns) share the cards' soft shadow plus a hairline.
            boxShadowSecondary: "0 28px 50px -24px rgba(16, 37, 37, 0.42), 0 0 0 1px rgba(16, 37, 37, 0.07)",
          },
          components: {
            Button: { controlHeight: 40, controlHeightLG: 48, fontWeight: 600, primaryShadow: "none", defaultShadow: "none" },
            // One focus ring: an ink border plus a soft amber halo on the wrapper.
            Input: { controlHeight: 40, controlHeightLG: 48, activeBorderColor: "#102525", hoverBorderColor: "#2b4f4f", activeShadow: "0 0 0 4px rgba(240, 164, 58, 0.28)" },
            InputNumber: { controlHeight: 40, controlHeightLG: 48, activeBorderColor: "#102525", hoverBorderColor: "#2b4f4f", activeShadow: "0 0 0 4px rgba(240, 164, 58, 0.28)" },
            Select: {
              controlHeight: 40,
              controlHeightLG: 48,
              activeBorderColor: "#102525",
              hoverBorderColor: "#2b4f4f",
              activeOutlineColor: "rgba(240, 164, 58, 0.28)",
              optionSelectedBg: "#102525",
              optionSelectedColor: "#f7f4ee",
              optionSelectedFontWeight: 600,
              optionActiveBg: "#efe9dd",
              optionHeight: 40,
              optionPadding: "9px 14px",
              borderRadiusLG: 16,
              borderRadiusSM: 10,
            },
            DatePicker: { controlHeight: 40, controlHeightLG: 48, activeBorderColor: "#102525", hoverBorderColor: "#2b4f4f", activeShadow: "0 0 0 4px rgba(240, 164, 58, 0.28)" },
            Dropdown: { borderRadiusLG: 16, controlItemBgHover: "#efe9dd" },
            Table: { headerBg: "#f7f4ee", headerColor: "#5b6966", borderColor: "#ece6da" },
            Segmented: { itemSelectedBg: "#1a3636", itemSelectedColor: "#f7f4ee", trackBg: "#efe9dd" },
            Modal: { borderRadiusLG: 28, contentBg: "#fffdf9" },
            Drawer: { colorBgElevated: "#102525" },
          },
        }}
      >
        {app ? <App>{children}</App> : children}
      </ConfigProvider>
    </StyleProvider>
  );
}
