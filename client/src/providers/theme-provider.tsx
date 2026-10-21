import type { ReactNode } from "react";
import { App, ConfigProvider } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";

export default function ThemeProvider({ children }: { children: ReactNode }) {
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
          },
          components: {
            Button: { controlHeight: 40, controlHeightLG: 48, fontWeight: 600, primaryShadow: "none", defaultShadow: "none" },
            Input: { controlHeight: 40, controlHeightLG: 48 },
            InputNumber: { controlHeight: 40, controlHeightLG: 48 },
            Select: { controlHeight: 40, controlHeightLG: 48 },
            DatePicker: { controlHeight: 40, controlHeightLG: 48 },
            Table: { headerBg: "#f7f4ee", headerColor: "#5b6966", borderColor: "#ece6da" },
            Segmented: { itemSelectedBg: "#1a3636", itemSelectedColor: "#f7f4ee", trackBg: "#efe9dd" },
            Modal: { borderRadiusLG: 28, contentBg: "#fffdf9" },
            Drawer: { colorBgElevated: "#102525" },
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </StyleProvider>
  );
}
