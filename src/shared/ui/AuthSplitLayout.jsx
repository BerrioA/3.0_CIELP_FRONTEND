import { Box, Stack, Typography } from "@mui/material";
import PublicNavbar from "../../features/public/components/PublicNavbar";

function AuthSplitLayout({ title, subtitle, asideTitle, asideText, form }) {
  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <PublicNavbar />

      <Box
        sx={{
          minHeight: "100dvh",
          pt: { xs: 8, md: 9 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        <Box
          sx={{
            position: "relative",
            p: { xs: 3, sm: 5, md: 8 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            background:
              "radial-gradient(circle at 10% 15%, rgba(60,166,166,0.16), transparent 32%), radial-gradient(circle at 85% 85%, rgba(224,142,47,0.16), transparent 35%), #F4F8F7",
            "&::before": {
              content: '""',
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "50%",
              top: -90,
              right: -70,
              background: "rgba(11,110,110,0.16)",
              filter: "blur(4px)",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              width: 250,
              height: 250,
              borderRadius: "50%",
              bottom: -80,
              left: -80,
              background: "rgba(224,142,47,0.20)",
              filter: "blur(4px)",
            },
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 520, zIndex: 1 }}>{form}</Box>
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            bgcolor: "primary.dark",
            color: "primary.contrastText",
            p: 8,
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(120deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 35%, rgba(255,255,255,0.09) 100%)",
            }}
          />
          <Stack
            spacing={3}
            sx={{ maxWidth: 460, zIndex: 1 }}
          >
            <Typography
              variant="overline"
              sx={{ letterSpacing: "0.14em" }}
            >
              CIELP PLATFORM
            </Typography>
            <Typography variant="h3">{asideTitle}</Typography>
            <Typography
              variant="body1"
              sx={{ color: "rgba(255,255,255,0.86)" }}
            >
              {asideText}
            </Typography>
            <Box
              sx={{
                width: 70,
                height: 4,
                borderRadius: 999,
                bgcolor: "secondary.main",
              }}
            />
            <Typography
              variant="h6"
              sx={{ color: "rgba(255,255,255,0.94)" }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.76)" }}
            >
              {subtitle}
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default AuthSplitLayout;
