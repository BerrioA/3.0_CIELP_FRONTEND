import { CssBaseline, ThemeProvider } from "@mui/material";
import { useMemo } from "react";
import AuthSessionProvider from "./AuthSessionProvider";
import createAppTheme from "../theme/createAppTheme";
import { useThemeStore } from "../store/theme.store";

function AppProviders({ children }) {
  const mode = useThemeStore((state) => state.mode);
  const appTheme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthSessionProvider>{children}</AuthSessionProvider>
    </ThemeProvider>
  );
}

export default AppProviders;
