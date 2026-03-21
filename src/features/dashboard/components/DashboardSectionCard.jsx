import { Paper, Stack, Typography } from "@mui/material";

function DashboardSectionCard({ title, description, children }) {
  return (
    <Paper
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 1.5,
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: "100%",
        display: "flex",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background:
            "linear-gradient(90deg, rgba(11,110,110,0.85) 0%, rgba(224,142,47,0.85) 100%)",
        },
      }}
    >
      <Stack
        spacing={1.2}
        sx={{ width: "100%", flexGrow: 1 }}
      >
        <Typography variant="h6">{title}</Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {description}
        </Typography>
        {children}
      </Stack>
    </Paper>
  );
}

export default DashboardSectionCard;
