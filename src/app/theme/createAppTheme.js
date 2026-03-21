import { createTheme } from "@mui/material/styles";

const createPaletteByMode = (mode) => {
  if (mode === "dark") {
    return {
      mode,
      primary: {
        main: "#4FC3C3",
        light: "#8EE0E0",
        dark: "#2B8C8C",
        contrastText: "#022222",
      },
      secondary: {
        main: "#F2B66F",
        light: "#FFD9A8",
        dark: "#C28740",
        contrastText: "#241200",
      },
      background: {
        default: "#0E1A1A",
        paper: "#132222",
      },
      text: {
        primary: "#E5F5F4",
        secondary: "#A8C7C6",
      },
      divider: "#244140",
    };
  }

  return {
    mode,
    primary: {
      main: "#0B6E6E",
      light: "#3CA6A6",
      dark: "#074E4E",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#E08E2F",
      light: "#F2B66F",
      dark: "#B86B14",
      contrastText: "#1D1200",
    },
    background: {
      default: "#F4F8F7",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#123234",
      secondary: "#4A6466",
    },
    divider: "#D9E7E7",
  };
};

export const createAppTheme = (mode = "light") =>
  createTheme({
    palette: createPaletteByMode(mode),
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: '"Sora", "Nunito Sans", sans-serif',
      h4: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
      },
      h6: {
        fontWeight: 650,
        letterSpacing: "-0.01em",
      },
      h2: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
      },
      h3: {
        fontWeight: 700,
        letterSpacing: "-0.02em",
      },
      h5: {
        fontWeight: 650,
        letterSpacing: "-0.01em",
      },
      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            border: mode === "dark" ? "1px solid #264544" : "1px solid #DCE9E8",
            boxShadow:
              mode === "dark"
                ? "0 20px 45px rgba(0, 0, 0, 0.35)"
                : "0 20px 45px rgba(10, 54, 54, 0.10)",
            backdropFilter: "blur(2px)",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            border: mode === "dark" ? "1px solid #244140" : "1px solid #DCE9E8",
            boxShadow:
              mode === "dark"
                ? "0 10px 30px rgba(0, 0, 0, 0.35)"
                : "0 10px 25px rgba(8, 48, 48, 0.10)",
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          fullWidth: true,
          variant: "outlined",
        },
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: 46,
            borderRadius: 10,
            fontWeight: 650,
            letterSpacing: "0.01em",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            color: mode === "dark" ? "#BFE2E0" : "#234345",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
    },
  });

export default createAppTheme;
